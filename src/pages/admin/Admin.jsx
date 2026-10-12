// Admin console — separate navigation and permissions from the contributor area.
// Opportunities, reviews and announcements are stored locally until a backend is connected.
import { useMemo, useState } from 'react';
import { useDocumentTitle, useStore } from '../../lib/hooks';
import { admin as adminApi, jobs as jobsApi } from '../../services/api';
import { store } from '../../services/store';
import { ADMIN_CONTRIBUTORS } from '../../data/seed';
import { ASSESSMENTS } from '../../data/jobs';
import {
  APPLICATION_STATUSES, CATEGORIES, COMPENSATION_TYPES, EXPERIENCE, LANGUAGES, PROFICIENCY, REGIONS, STATUS_META, WORK_TYPES, categoryById, compensationLabel, experienceLabel,
} from '../../data/constants';
import { fmtDate, relative } from '../../lib/format';
import { PageHead } from '../../components/layout/AppShell';
import { ApplicationTimeline } from '../app/Applications';
import { Alert, Badge, Button, Checkbox, Dialog, EmptyState, Field, Icon, Input, Progress, SampleBadge, Select, StatusBadge, Tabs, Textarea, useToast } from '../../components/ui';
import { t } from '../../i18n';

function useJobMap() {
  const jobs = useStore((s) => s.jobs);
  return useMemo(() => Object.fromEntries(jobs.map((j) => [j.id, j])), [jobs]);
}

const applicantName = (a, users) => a.applicantName || users.find((u) => u.id === a.userId)?.profile?.fullName || t('Contributor');

/* ---------------- Overview ---------------- */
export function AdminOverview() {
  useDocumentTitle(t('Admin overview'));
  const jobs = useStore((s) => s.jobs);
  const apps = useStore((s) => s.applications);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const jobMap = useJobMap();
  const openJobs = jobs.filter((j) => j.status === 'open');
  const queue = apps.filter((a) => a.status === 'submitted' || a.status === 'under_review');
  const byStatus = APPLICATION_STATUSES.map((s) => ({ s, n: apps.filter((a) => a.status === s).length })).filter((x) => x.n);
  const max = Math.max(...byStatus.map((x) => x.n), 1);
  const byCat = CATEGORIES.map((c) => ({ c, n: openJobs.filter((j) => j.category === c.id).length }));

  return (
    <>
      <PageHead title={t('Operations overview')} description={t('Live metrics across opportunities, applications and projects.')} />
      <div className="stat-grid">
        {[
          { icon: 'briefcase', l: 'Open opportunities', v: openJobs.length },
          { icon: 'clipboard', l: 'Awaiting review', v: queue.length },
          { icon: 'users', l: 'Contributors', v: users.filter((u) => u.role === 'contributor').length + ADMIN_CONTRIBUTORS.length },
          { icon: 'folder', l: 'Active projects', v: projects.filter((p) => p.status === 'active').length },
        ].map((s) => (
          <div className="stat card" key={s.l}>
            <span className="icon-tile sm steel"><Icon name={s.icon} /></span>
            <span className="stat-value">{s.v}</span>
            <span className="stat-label">{t(s.l)}</span>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="dash-col">
          <section className="card">
            <div className="card-header"><h2>{t('Review queue')}</h2><Button to="/admin/applications" variant="ghost" size="sm">{t('Open queue')}</Button></div>
            {queue.length === 0 ? (
              <EmptyState icon="checkCircle" title={t('Queue is clear')}>{t('No applications are waiting for review.')}</EmptyState>
            ) : (
              <ul className="list">
                {queue.slice(0, 5).map((a) => (
                  <li key={a.id} className="list-row static">
                    <span className="grow">
                      <span className="list-title">{applicantName(a, users)}</span>
                      <span className="list-sub">{jobMap[a.jobId]?.title}</span>
                    </span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card card-pad">
            <h2 className="h-card" style={{ marginBottom: 16 }}>{t('Open listings by category')}</h2>
            <div className="bars">
              {byCat.map(({ c, n }) => (
                <div className="bar-row" key={c.id}>
                  <span className="small">{c.short}</span>
                  <span className="bar-track"><span style={{ width: `${(n / Math.max(...byCat.map((x) => x.n), 1)) * 100}%` }} /></span>
                  <span className="small t-strong">{n}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="dash-col">
          <section className="card card-pad">
            <h2 className="h-card" style={{ marginBottom: 16 }}>{t('Applications by status')}</h2>
            <div className="bars">
              {byStatus.map(({ s, n }) => (
                <div className="bar-row" key={s}>
                  <StatusBadge status={s} />
                  <span className="bar-track"><span style={{ width: `${(n / max) * 100}%` }} /></span>
                  <span className="small t-strong">{n}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="card card-pad">
            <h2 className="h-card" style={{ marginBottom: 8 }}>{t('Closing soon')}</h2>
            <ul className="list compact">
              {openJobs.filter((j) => j.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4).map((j) => (
                <li key={j.id} className="row-between small" style={{ padding: '8px 0' }}>
                  <span>{j.title}</span>
                  <span className="subtle nowrap">{fmtDate(j.deadline)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

/* ---------------- Jobs ---------------- */
const BLANK_JOB = {
  title: '', category: 'voice', workspace: 'audio', summary: '', overview: '', languages: [{ name: 'English', level: 'fluent' }], regions: ['Global'],
  workType: 'one_time', commitment: '', compensation: { type: 'per_task' }, experience: 'entry', deadline: '', featured: false,
  assessment: { required: false }, responsibilities: [], mandatory: [], preferred: [], equipment: [], faqs: [], status: 'open',
};
const WORKSPACE_BY_CAT = { voice: 'audio', transcription: 'transcription', translation: 'translation', annotation: 'annotation', collection: 'collection', evaluation: 'evaluation' };
const lines = (arr) => (arr || []).join('\n');
const unlines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function JobEditor({ job, onClose }) {
  const toast = useToast();
  const [j, setJ] = useState(() => ({ ...BLANK_JOB, ...job, deadline: job?.deadline || '' }));
  const [text, setText] = useState(() => ({ responsibilities: lines(j.responsibilities), mandatory: lines(j.mandatory), preferred: lines(j.preferred), equipment: lines(j.equipment) }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setJ((x) => ({ ...x, [k]: v }));
  const save = async () => {
    const e = {};
    if (j.title.trim().length < 8) e.title = t('Title must be at least 8 characters.');
    if (j.summary.trim().length < 20) e.summary = t('Add a one-sentence summary (20+ characters).');
    if (!j.commitment.trim()) e.commitment = t('Describe the expected time commitment.');
    if (!unlines(text.mandatory).length) e.mandatory = t('List at least one mandatory requirement.');
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const template = Object.values(ASSESSMENTS).find((a) => a.category === j.category);
    await jobsApi.save({
      ...j,
      deadline: j.deadline || null,
      overview: j.overview || j.summary,
      workspace: WORKSPACE_BY_CAT[j.category],
      responsibilities: unlines(text.responsibilities),
      mandatory: unlines(text.mandatory),
      preferred: unlines(text.preferred),
      equipment: unlines(text.equipment),
      assessment: j.assessment.required && template ? { required: true, id: template.id, name: template.name, duration: template.duration } : { required: false },
    });
    setBusy(false);
    toast(job?.id ? t('Opportunity updated') : t('Opportunity published'));
    onClose();
  };
  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={job?.id ? t('Edit opportunity') : t('Create opportunity')}
      description={t('Changes appear immediately in the public listing.')}
      footer={<><Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button><Button loading={busy} onClick={save}>{job?.id ? t('Save changes') : t('Publish opportunity')}</Button></>}
    >
      <div className="form-grid">
        <Field label={t('Title')} error={errors.title} className="span-2"><Input value={j.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label={t('Category')}><Select value={j.category} onChange={(e) => set('category', e.target.value)} options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))} /></Field>
        <Field label={t('Experience level')}><Select value={j.experience} onChange={(e) => set('experience', e.target.value)} options={EXPERIENCE} /></Field>
        <Field label={t('Summary')} error={errors.summary} className="span-2"><Textarea rows={2} style={{ minHeight: 70 }} value={j.summary} onChange={(e) => set('summary', e.target.value)} /></Field>
        <Field label={t('Project overview')} optional className="span-2"><Textarea value={j.overview} onChange={(e) => set('overview', e.target.value)} /></Field>
        <Field label={t('Primary language')}><Select value={j.languages[0]?.name} onChange={(e) => set('languages', [{ ...j.languages[0], name: e.target.value }, ...j.languages.slice(1)])} options={LANGUAGES} /></Field>
        <Field label={t('Minimum proficiency')}><Select value={j.languages[0]?.level} onChange={(e) => set('languages', [{ ...j.languages[0], level: e.target.value }, ...j.languages.slice(1)])} options={PROFICIENCY} /></Field>
        <Field label={t('Region')}><Select value={j.regions[0]} onChange={(e) => set('regions', [e.target.value])} options={REGIONS} /></Field>
        <Field label={t('Work type')}><Select value={j.workType} onChange={(e) => set('workType', e.target.value)} options={WORK_TYPES} /></Field>
        <Field label={t('Time commitment')} error={errors.commitment}><Input value={j.commitment} onChange={(e) => set('commitment', e.target.value)} placeholder={t('e.g. 5–10 hours / week')} /></Field>
        <Field label={t('Compensation type')}><Select value={j.compensation.type} onChange={(e) => set('compensation', { ...j.compensation, type: e.target.value })} options={COMPENSATION_TYPES} /></Field>
        <Field label={t('Application deadline')} optional><Input type="date" value={j.deadline} onChange={(e) => set('deadline', e.target.value)} /></Field>
        <Field label={t('Status')}><Select value={j.status} onChange={(e) => set('status', e.target.value)} options={[{ value: 'open', label: t('Open') }, { value: 'closed', label: t('Closed (hidden from listing)') }]} /></Field>
        <Field label={t('Mandatory requirements')} hint={t('One per line.')} error={errors.mandatory} className="span-2"><Textarea value={text.mandatory} onChange={(e) => setText({ ...text, mandatory: e.target.value })} /></Field>
        <Field label={t('Preferred qualifications')} hint={t('One per line.')} optional className="span-2"><Textarea style={{ minHeight: 80 }} value={text.preferred} onChange={(e) => setText({ ...text, preferred: e.target.value })} /></Field>
        <Field label={t('Responsibilities')} hint={t('One per line.')} optional className="span-2"><Textarea style={{ minHeight: 80 }} value={text.responsibilities} onChange={(e) => setText({ ...text, responsibilities: e.target.value })} /></Field>
        <Field label={t('Equipment')} hint={t('One per line.')} optional className="span-2"><Textarea style={{ minHeight: 70 }} value={text.equipment} onChange={(e) => setText({ ...text, equipment: e.target.value })} /></Field>
        <div className="span-2 row">
          <Checkbox label={t('Requires an assessment')} checked={j.assessment.required} onChange={(e) => set('assessment', { required: e.target.checked })} />
          <Checkbox label={t('Feature on homepage')} checked={j.featured} onChange={(e) => set('featured', e.target.checked)} />
        </div>
      </div>
    </Dialog>
  );
}

export function AdminJobs() {
  useDocumentTitle(t('Manage opportunities'));
  const jobs = useStore((s) => s.jobs);
  const apps = useStore((s) => s.applications);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const rows = jobs.filter((j) => !q || j.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title={t('Opportunities')} description={t('Create, edit and close listings.')} actions={<Button icon="plus" onClick={() => setEditing({})}>{t('New opportunity')}</Button>} />
      <div className="card">
        <div className="table-tools">
          <div className="input-group grow" style={{ maxWidth: 360 }}>
            <Icon name="search" />
            <label htmlFor="aj-q" className="sr-only">{t('Search opportunities')}</label>
            <input id="aj-q" className="input" type="search" placeholder={t('Search by title')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <span className="small subtle">{t('{n} listings', { n: rows.length })}</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">{t('Title')}</th><th scope="col">{t('Category')}</th><th scope="col">{t('Level')}</th><th scope="col">{t('Compensation')}</th><th scope="col">{t('Applicants')}</th><th scope="col">{t('Deadline')}</th><th scope="col">{t('Status')}</th><th scope="col"><span className="sr-only">{t('Actions')}</span></th></tr></thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id}>
                  <td className="t-strong">{j.title}</td>
                  <td>{categoryById[j.category].short}</td>
                  <td>{experienceLabel[j.experience]}</td>
                  <td>{compensationLabel[j.compensation.type]}</td>
                  <td>{apps.filter((a) => a.jobId === j.id && a.status !== 'draft').length}</td>
                  <td className="nowrap">{j.deadline ? fmtDate(j.deadline) : t('Rolling')}</td>
                  <td><span className={`badge badge-dot status-${j.status}`}>{j.status === 'open' ? t('Open') : t('Closed')}</span></td>
                  <td><Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(store.get().jobs.find((x) => x.id === j.id))} aria-label={t('Edit {title}', { title: j.title })}>{t('Edit')}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <JobEditor job={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </>
  );
}

/* ---------------- Application review ---------------- */
export function AdminApplications() {
  useDocumentTitle(t('Application review'));
  const apps = useStore((s) => s.applications);
  const users = useStore((s) => s.users);
  const jobMap = useJobMap();
  const toast = useToast();
  const [tab, setTab] = useState('queue');
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(null);
  const visible = apps.filter((a) => a.status !== 'draft');
  const rows = visible.filter((a) => (tab === 'queue' ? ['submitted', 'under_review'].includes(a.status) : tab === 'all' ? true : a.status === tab)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const current = sel && apps.find((a) => a.id === sel);
  const job = current && jobMap[current.jobId];
  const assessmentPending = job?.assessment?.required && current?.assessment?.status !== 'completed';

  const decide = async (status) => {
    setBusy(status);
    await adminApi.decide(current.id, status, note.trim() || undefined);
    setBusy(null);
    toast(t('Marked as {status}', { status: STATUS_META[status].label }));
    setSel(null);
    setNote('');
  };

  return (
    <>
      <PageHead title={t('Application review')} description={t('Review submitted applications and record decisions. Contributors are notified in their dashboard.')} />
      <div className="card">
        <div style={{ padding: '8px 24px 0' }}>
          <Tabs
            label={t('Filter applications')}
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'queue', label: t('Needs review'), count: visible.filter((a) => ['submitted', 'under_review'].includes(a.status)).length },
              { id: 'assessment_required', label: t('Awaiting assessment'), count: visible.filter((a) => a.status === 'assessment_required').length },
              { id: 'accepted', label: t('Accepted'), count: visible.filter((a) => a.status === 'accepted').length },
              { id: 'rejected', label: t('Rejected'), count: visible.filter((a) => a.status === 'rejected').length },
              { id: 'all', label: t('All'), count: visible.length },
            ]}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon="checkCircle" title={t('Nothing here')}>{t('No applications in this view.')}</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">{t('Applicant')}</th><th scope="col">{t('Opportunity')}</th><th scope="col">{t('Assessment')}</th><th scope="col">{t('Status')}</th><th scope="col">{t('Updated')}</th><th scope="col"><span className="sr-only">{t('Actions')}</span></th></tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="t-strong">{applicantName(a, users)}</td>
                    <td>{jobMap[a.jobId]?.title}</td>
                    <td>{jobMap[a.jobId]?.assessment?.required ? (a.assessment?.status === 'completed' ? t('Completed') : t('Pending')) : '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="nowrap subtle">{fmtDate(a.updatedAt)}</td>
                    <td><Button size="sm" variant="secondary" onClick={() => setSel(a.id)}>{t('Review')}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {current && (
        <Dialog
          open
          onClose={() => setSel(null)}
          size="lg"
          title={applicantName(current, users)}
          description={job.title}
          footer={
            ['submitted', 'under_review'].includes(current.status) ? (
              <>
                {current.status === 'submitted' && <Button variant="secondary" loading={busy === 'under_review'} onClick={() => decide('under_review')}>{t('Start review')}</Button>}
                <Button variant="danger" loading={busy === 'rejected'} onClick={() => decide('rejected')}>{t('Reject')}</Button>
                <Button loading={busy === 'accepted'} disabled={assessmentPending} onClick={() => decide('accepted')}>{t('Accept')}</Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setSel(null)}>{t('Close')}</Button>
            )
          }
        >
          <div className="detail-grid admin-review">
            <div className="stack">
              <dl className="kv">
                <dt>{t('Status')}</dt><dd><StatusBadge status={current.status} /></dd>
                <dt>{t('Applied')}</dt><dd>{fmtDate(current.createdAt)}</dd>
                <dt>{t('Availability')}</dt><dd>{current.answers?.hours ? t(current.answers.hours) : '—'}</dd>
              </dl>
              {current.answers?.motivation && <Alert tone="info" title={t('Applicant’s answer')}>{current.answers.motivation}</Alert>}
              {assessmentPending && <Alert tone="warning">{t('The required assessment has not been completed. A decision can be recorded once it is.')}</Alert>}
              {['submitted', 'under_review'].includes(current.status) && (
                <Field label={t('Decision note')} optional hint={t('Shared with the contributor.')}>
                  <Textarea style={{ minHeight: 80 }} value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
              )}
            </div>
            <div>
              <h3 className="h-card" style={{ marginBottom: 12 }}>{t('Timeline')}</h3>
              <ApplicationTimeline app={current} job={job} />
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}

/* ---------------- Contributors ---------------- */
export function AdminContributors() {
  useDocumentTitle(t('Contributors'));
  const [q, setQ] = useState('');
  const users = useStore((s) => s.users);
  const apps = useStore((s) => s.applications);
  const registered = users
    .filter((u) => u.role === 'contributor' && u.id !== 'u-demo')
    .map((u) => ({
      id: u.id,
      name: u.profile?.fullName || u.email,
      email: u.email,
      country: u.profile?.country || '—',
      languages: (u.profile?.languages || []).map((l) => l.name),
      joined: u.createdAt,
      applications: apps.filter((a) => a.userId === u.id && a.status !== 'draft').length,
      status: 'active',
    }));
  const all = [...registered, ...ADMIN_CONTRIBUTORS];
  const rows = all.filter((c) => !q || (c.name + c.country + c.languages.join(' ')).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title={t('Contributors')} description={t('People who signed up, followed by sample contributors.')} />
      <div className="card">
        <div className="table-tools">
          <div className="input-group grow" style={{ maxWidth: 360 }}>
            <Icon name="search" />
            <label htmlFor="ac-q" className="sr-only">{t('Search contributors')}</label>
            <input id="ac-q" className="input" type="search" placeholder={t('Search name, country or language')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">{t('Name')}</th><th scope="col">{t('Country')}</th><th scope="col">{t('Languages')}</th><th scope="col">{t('Joined')}</th><th scope="col">{t('Applications')}</th><th scope="col">{t('Status')}</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="t-strong">{c.name}</div>
                    {c.email ? <div className="xs subtle">{c.email}</div> : <SampleBadge />}
                  </td>
                  <td>{t(c.country)}</td>
                  <td>{c.languages.map((l) => t(l)).join(t(', ')) || '—'}</td>
                  <td className="nowrap">{fmtDate(c.joined)}</td>
                  <td>{c.applications}</td>
                  <td><span className={`badge badge-dot status-${c.status}`}>{c.status === 'active' ? t('Active') : t('Paused')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState icon="users" title={t('No contributors match')}>{t('Try another search.')}</EmptyState>}
      </div>
    </>
  );
}

/* ---------------- Assessments ---------------- */
export function AdminAssessments() {
  useDocumentTitle(t('Assessment management'));
  const apps = useStore((s) => s.applications);
  const jobs = useStore((s) => s.jobs);
  return (
    <>
      <PageHead title={t('Assessments')} description={t('Assessment templates and completion across applications.')} />
      <div className="project-grid">
        {Object.values(ASSESSMENTS).map((a) => {
          const jobIds = jobs.filter((j) => j.assessment?.id === a.id).map((j) => j.id);
          const related = apps.filter((x) => jobIds.includes(x.jobId) && x.assessment);
          const done = related.filter((x) => x.assessment.status === 'completed').length;
          return (
            <article className="card card-pad" key={a.id}>
              <div className="row" style={{ gap: 10 }}>
                <span className="icon-tile sm steel"><Icon name={categoryById[a.category].icon} /></span>
                <Badge tone="outline">{a.duration}</Badge>
              </div>
              <h2 className="h-card" style={{ marginTop: 12 }}>{a.name}</h2>
              <p className="small muted" style={{ marginTop: 4 }}>{t('{n} questions · used by {m} listings', { n: a.questions.length, m: jobIds.length })}</p>
              <div className="row-between xs subtle" style={{ marginTop: 14 }}><span>{t('Completed')}</span><span>{done}/{related.length}</span></div>
              <Progress value={related.length ? (done / related.length) * 100 : 0} label={t('{name} completion', { name: a.name })} />
              <details className="q-preview">
                <summary className="small">{t('Preview questions')}</summary>
                <ol className="small muted">{a.questions.map((q) => <li key={q.id}>{q.prompt}</li>)}</ol>
              </details>
            </article>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Projects ---------------- */
export function AdminProjects() {
  useDocumentTitle(t('Project tracking'));
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const apps = useStore((s) => s.applications);
  const jobMap = useJobMap();
  return (
    <>
      <PageHead title={t('Project tracking')} description={t('Progress of contributors on accepted projects.')} />
      <div className="card">
        {projects.length === 0 ? (
          <EmptyState icon="folder" title={t('No projects')}>{t('Accepted applications create projects automatically.')}</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">{t('Project')}</th><th scope="col">{t('Contributor')}</th><th scope="col">{t('Progress')}</th><th scope="col">{t('Status')}</th><th scope="col">{t('Started')}</th></tr></thead>
              <tbody>
                {projects.map((p) => {
                  const app = apps.find((a) => a.id === p.applicationId);
                  return (
                    <tr key={p.id}>
                      <td className="t-strong">{jobMap[p.jobId]?.title}</td>
                      <td>{app ? applicantName(app, users) : '—'}</td>
                      <td style={{ minWidth: 180 }}>
                        <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                          <span style={{ flex: 1 }}><Progress value={(p.done / p.total) * 100} label={t('Progress')} /></span>
                          <span className="xs subtle nowrap">{p.done}/{p.total}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="nowrap">{p.startedAt ? fmtDate(p.startedAt) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- Announcements ---------------- */
export function AdminAnnouncements() {
  useDocumentTitle(t('Announcements'));
  const list = useStore((s) => s.announcements);
  const toast = useToast();
  const [f, setF] = useState({ title: '', body: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.title.trim().length < 5) er.title = t('Title must be at least 5 characters.');
    if (f.body.trim().length < 15) er.body = t('Message must be at least 15 characters.');
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    await adminApi.announce(f);
    setBusy(false);
    setF({ title: '', body: '' });
    toast(t('Announcement posted to all contributor dashboards'));
  };
  return (
    <>
      <PageHead title={t('Announcements')} description={t('Post in-app notices to every contributor.')} />
      <div className="help-grid">
        <form className="card card-pad stack" onSubmit={submit} noValidate>
          <h2 className="h-card">{t('New announcement')}</h2>
          <Field label={t('Title')} error={errors.title}><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label={t('Message')} error={errors.body}><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
          <Button type="submit" icon="megaphone" loading={busy} style={{ alignSelf: 'flex-start' }}>{t('Post announcement')}</Button>
        </form>
        <section className="card">
          <div className="card-header"><h2>{t('Posted')}</h2></div>
          {list.length === 0 ? (
            <EmptyState icon="megaphone" title={t('No announcements yet')}>{t('Announcements you post appear here and in contributor notifications.')}</EmptyState>
          ) : (
            <ul className="list">
              {list.map((a) => (
                <li key={a.id} className="list-row static">
                  <span className="grow">
                    <span className="list-title">{a.title}</span>
                    <span className="list-sub">{a.body}</span>
                  </span>
                  <span className="xs subtle nowrap">{relative(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
