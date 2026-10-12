import { useMemo, useState } from 'react';
import { Link, navigate } from '../../lib/router';
import { useDocumentTitle, useQuery, useStore } from '../../lib/hooks';
import { applications as appsApi } from '../../services/api';
import { APPLICATION_STATUSES, STATUS_META, categoryById } from '../../data/constants';
import { fmtDate } from '../../lib/format';
import { PageHead } from '../../components/layout/AppShell';
import { Alert, Button, Dialog, EmptyState, ErrorState, Icon, LoadingCards, Select, StatusBadge, Tabs, useToast } from '../../components/ui';
import { t, translated } from '../../i18n';

const TIMELINE_STEPS = translated([
  { key: 'submitted', label: 'Application submitted' },
  { key: 'assessment', label: 'Assessment completed' },
  { key: 'under_review', label: 'Review in progress' },
  { key: 'decision', label: 'Decision issued' },
], 'label');

/** Builds milestone states strictly from recorded history — never assumes progress. */
function milestones(app, job) {
  const has = (s) => app.history.find((h) => h.status === s);
  const decision = app.history.find((h) => h.status === 'accepted' || h.status === 'rejected');
  const assessmentDone = app.assessment?.status === 'completed';
  const steps = TIMELINE_STEPS.filter((s) => s.key !== 'assessment' || job?.assessment?.required);
  const resolve = {
    submitted: () => ({ done: !!has('submitted'), at: has('submitted')?.at }),
    assessment: () => ({ done: assessmentDone, at: app.assessment?.completedAt }),
    under_review: () => ({ done: !!has('under_review'), at: has('under_review')?.at }),
    decision: () => ({
      done: !!decision,
      at: decision?.at,
      note: decision && `${STATUS_META[decision.status].label}${decision.note ? ` — ${t(decision.note)}` : ''}`,
    }),
  };
  return steps.map((s) => ({ ...s, ...resolve[s.key]() }));
}

export function ApplicationTimeline({ app, job }) {
  if (app.status === 'withdrawn' || app.status === 'draft') {
    return (
      <ol className="timeline">
        {app.history.map((h, i) => (
          <li key={i} data-state="done">
            <span className="dot"><Icon name="check" /></span>
            <div>
              <div className="t-title">{STATUS_META[h.status].label}</div>
              <div className="t-meta">{fmtDate(h.at)}{h.note ? ` · ${t(h.note)}` : ''}</div>
            </div>
          </li>
        ))}
      </ol>
    );
  }
  const ms = milestones(app, job);
  const currentIdx = ms.findIndex((m) => !m.done);
  return (
    <ol className="timeline">
      {ms.map((m, i) => {
        const state = m.done ? 'done' : i === currentIdx ? 'current' : 'pending';
        return (
          <li key={m.key} data-state={state}>
            <span className="dot">{m.done ? <Icon name="check" /> : state === 'current' ? <Icon name="clock" /> : null}</span>
            <div>
              <div className="t-title">{m.label}</div>
              <div className="t-meta">{m.done ? `${fmtDate(m.at)}${m.note ? ` · ${m.note}` : ''}` : state === 'current' ? (m.key === 'assessment' ? t('Waiting for you') : t('In progress')) : t('Not yet')}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function NextAction({ app }) {
  const map = {
    draft: <Button size="sm" variant="secondary" to={`/app/opportunities/${app.jobId}?apply=1`}>{t('Finish application')}</Button>,
    assessment_required: <Button size="sm" to={`/app/assessments/${app.id}`}>{t('Start assessment')}</Button>,
    accepted: <Button size="sm" variant="secondary" to="/app/projects">{t('Open project')}</Button>,
  };
  return map[app.status] || <span className="small subtle">{STATUS_META[app.status].next}</span>;
}

export default function Applications() {
  useDocumentTitle(t('My Applications'));
  const { data, loading, error, reload } = useQuery(() => appsApi.mine());
  const jobs = useStore((s) => s.jobs);
  const jobById = useMemo(() => Object.fromEntries(jobs.map((j) => [j.id, j])), [jobs]);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('updated');

  const apps = data || [];
  const count = (s) => apps.filter((a) => a.status === s).length;
  const tabs = [
    { id: 'all', label: t('All'), count: apps.length },
    ...APPLICATION_STATUSES.filter((s) => count(s) > 0).map((s) => ({ id: s, label: STATUS_META[s].label, count: count(s) })),
  ];
  const rows = apps
    .filter((a) => tab === 'all' || a.status === tab)
    .filter((a) => !q || jobById[a.jobId]?.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'updated' ? b.updatedAt.localeCompare(a.updatedAt) : sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));

  return (
    <>
      <PageHead title={t('My Applications')} description={t('Track the status of every application and see what to do next.')} actions={<Button to="/app/opportunities" icon="search">{t('Find opportunities')}</Button>} />
      {loading ? (
        <LoadingCards count={3} />
      ) : error ? (
        <div className="card"><ErrorState onRetry={reload}>{error.message}</ErrorState></div>
      ) : apps.length === 0 ? (
        <div className="card">
          <EmptyState icon="clipboard" title={t('You haven’t applied to anything yet')} actions={<Button to="/app/opportunities">{t('Browse opportunities')}</Button>}>
            {t('Find a project that matches your languages and skills. Your applications and their status will appear here.')}
          </EmptyState>
        </div>
      ) : (
        <div className="card">
          <div style={{ padding: '8px 24px 0' }}>
            <Tabs tabs={tabs.length > 1 ? tabs : tabs.slice(0, 1)} value={tabs.some((t) => t.id === tab) ? tab : 'all'} onChange={setTab} label={t('Filter by status')} />
          </div>
          <div className="table-tools">
            <div className="input-group grow" style={{ maxWidth: 360 }}>
              <Icon name="search" />
              <label htmlFor="app-search" className="sr-only">{t('Search applications')}</label>
              <input id="app-search" className="input" type="search" placeholder={t('Search by job title')} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="row" style={{ gap: 8 }}>
              <label htmlFor="app-sort" className="small subtle">{t('Sort')}</label>
              <Select id="app-sort" style={{ width: 'auto', minHeight: 38 }} value={sort} onChange={(e) => setSort(e.target.value)} options={[{ value: 'updated', label: t('Last updated') }, { value: 'newest', label: t('Newest applied') }, { value: 'oldest', label: t('Oldest applied') }]} />
            </div>
          </div>
          {rows.length === 0 ? (
            <EmptyState icon="search" title={t('No applications match')} actions={<Button variant="secondary" onClick={() => { setQ(''); setTab('all'); }}>{t('Clear filters')}</Button>}>
              {t('Try a different search or status.')}
            </EmptyState>
          ) : (
            <>
              <div className="table-wrap desktop-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">{t('Opportunity')}</th>
                      <th scope="col">{t('Applied')}</th>
                      <th scope="col">{t('Status')}</th>
                      <th scope="col">{t('Next action')}</th>
                      <th scope="col">{t('Last updated')}</th>
                      <th scope="col"><span className="sr-only">{t('Actions')}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => {
                      const job = jobById[a.jobId];
                      return (
                        <tr key={a.id}>
                          <td>
                            <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                              <span className="icon-tile sm"><Icon name={categoryById[job?.category]?.icon || 'briefcase'} /></span>
                              <div>
                                <div className="t-strong">{job?.title}</div>
                                <div className="xs subtle">{categoryById[job?.category]?.short}</div>
                              </div>
                            </div>
                          </td>
                          <td className="nowrap">{a.status === 'draft' ? '—' : fmtDate(a.createdAt)}</td>
                          <td><StatusBadge status={a.status} /></td>
                          <td><NextAction app={a} /></td>
                          <td className="nowrap subtle">{fmtDate(a.updatedAt)}</td>
                          <td>
                            <Link to={`/app/applications/${a.id}`} className="link-btn small nowrap" aria-label={t('View details for {title}', { title: job?.title })}>
                              {t('View Details')} <Icon name="chevronRight" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <ul className="mobile-list">
                {rows.map((a) => {
                  const job = jobById[a.jobId];
                  return (
                    <li key={a.id}>
                      <button type="button" className="m-row" onClick={() => navigate(`/app/applications/${a.id}`)}>
                        <div className="row-between" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                          <strong>{job?.title}</strong>
                          <StatusBadge status={a.status} />
                        </div>
                        <span className="xs subtle">{t('Updated {date}', { date: fmtDate(a.updatedAt) })} · {STATUS_META[a.status].next}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </>
  );
}

export function ApplicationDetail({ id }) {
  const { data: app, loading, error, reload } = useQuery(() => appsApi.get(id), [id]);
  const jobs = useStore((s) => s.jobs);
  const job = app && jobs.find((j) => j.id === app.jobId);
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(job ? `${t('Application')} — ${job.title}` : t('Application'));

  if (loading) return <LoadingCards count={2} />;
  if (error) return <div className="card"><ErrorState onRetry={reload}>{error.message}</ErrorState></div>;

  const canWithdraw = ['submitted', 'under_review', 'assessment_required'].includes(app.status);
  const doAction = async () => {
    setBusy(true);
    if (confirm === 'withdraw') {
      await appsApi.withdraw(app.id);
      toast(t('Application withdrawn'));
    } else {
      await appsApi.discardDraft(app.id);
      toast(t('Draft deleted'));
      navigate('/app/applications');
    }
    setBusy(false);
    setConfirm(null);
  };

  return (
    <>
      <nav className="breadcrumb" aria-label={t('Breadcrumb')}>
        <Link to="/app/applications">{t('My Applications')}</Link>
        <Icon name="chevronRight" />
        <span>{job.title}</span>
      </nav>
      <PageHead
        title={job.title}
        description={`${categoryById[job.category].name} · ${t('Application')} ${app.id.toUpperCase()}`}
        actions={
          <>
            <Button to={`/app/opportunities/${job.id}`} variant="secondary" icon="file">{t('View opportunity')}</Button>
            {canWithdraw && <Button variant="danger" onClick={() => setConfirm('withdraw')}>{t('Withdraw')}</Button>}
            {app.status === 'draft' && <Button variant="danger" icon="trash" onClick={() => setConfirm('discard')}>{t('Delete draft')}</Button>}
          </>
        }
      />
      <div className="detail-grid">
        <div className="stack">
          <section className="card card-pad">
            <div className="row-between" style={{ marginBottom: 16 }}>
              <h2 className="h-card">{t('Current status')}</h2>
              <StatusBadge status={app.status} />
            </div>
            {app.status === 'assessment_required' && (
              <Alert tone="warning" title={t('Action needed: complete the assessment')}>
                <p>{t('Your application will be reviewed after you complete the {name}.', { name: job.assessment?.name })}</p>
                <Button size="sm" style={{ marginTop: 10 }} to={`/app/assessments/${app.id}`}>{t('Start assessment')}</Button>
              </Alert>
            )}
            {app.status === 'submitted' && <Alert tone="info">{t('Your application has been received and is waiting to be reviewed. No action is needed from you right now.')}</Alert>}
            {app.status === 'under_review' && <Alert tone="info">{t('The project team is reviewing your application. You will be notified when a decision is made.')}</Alert>}
            {app.status === 'accepted' && (
              <Alert tone="success" title={t('You were accepted')}>
                <p>{t('Review the project agreement and open your workspace to begin.')}</p>
                <Button size="sm" style={{ marginTop: 10 }} to="/app/projects">{t('Go to My Projects')}</Button>
              </Alert>
            )}
            {app.status === 'rejected' && <Alert tone="danger" title={t('Not selected this time')}>{t(app.history.at(-1)?.note || 'This application was not accepted.')} {t('You are welcome to apply to other opportunities.')}</Alert>}
            {app.status === 'withdrawn' && <Alert tone="info">{t('You withdrew this application. You can apply again while the opportunity remains open.')}</Alert>}
            {app.status === 'draft' && (
              <Alert tone="info" title={t('Draft — not submitted')}>
                <p>{t('This application has not been sent. Finish and submit it before the deadline.')}</p>
                <Button size="sm" style={{ marginTop: 10 }} to={`/app/opportunities/${job.id}?apply=1`}>{t('Finish application')}</Button>
              </Alert>
            )}
          </section>
          <section className="card card-pad">
            <h2 className="h-card" style={{ marginBottom: 20 }}>{t('Timeline')}</h2>
            <ApplicationTimeline app={app} job={job} />
          </section>
        </div>
        <aside className="stack">
          <section className="card card-pad">
            <h2 className="h-card" style={{ marginBottom: 12 }}>{t('Details')}</h2>
            <dl className="kv">
              <dt>{t('Applied')}</dt><dd>{app.status === 'draft' ? t('Not submitted') : fmtDate(app.createdAt)}</dd>
              <dt>{t('Last updated')}</dt><dd>{fmtDate(app.updatedAt)}</dd>
              <dt>{t('Assessment')}</dt><dd>{job.assessment?.required ? (app.assessment?.status === 'completed' ? t('Completed') : t('Not completed')) : t('Not required')}</dd>
              <dt>{t('Availability')}</dt><dd>{app.answers?.hours ? t(app.answers.hours) : '—'}</dd>
            </dl>
          </section>
          {app.answers?.motivation && (
            <section className="card card-pad">
              <h2 className="h-card" style={{ marginBottom: 8 }}>{t('Your answer')}</h2>
              <p className="small muted">{app.answers.motivation}</p>
            </section>
          )}
        </aside>
      </div>
      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === 'withdraw' ? t('Withdraw this application?') : t('Delete this draft?')}
        description={confirm === 'withdraw' ? t('The project team will no longer review it. You can apply again later if the opportunity is still open.') : t('This draft will be removed. This cannot be undone.')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>{t('Cancel')}</Button>
            <Button variant="danger" loading={busy} onClick={doAction}>{confirm === 'withdraw' ? t('Withdraw application') : t('Delete draft')}</Button>
          </>
        }
      >
        <p className="small"><strong>{job.title}</strong></p>
      </Dialog>
    </>
  );
}
