import { useMemo, useState } from 'react';
import { Link } from '../../lib/router';
import { useDocumentTitle, useQuery, useStore } from '../../lib/hooks';
import { projects as projectsApi } from '../../services/api';
import { categoryById } from '../../data/constants';
import { AGREEMENT_POINTS } from '../../data/tasks';
import { fmtDate } from '../../lib/format';
import { PageHead } from '../../components/layout/AppShell';
import { WORKSPACES } from '../../components/workspace/Workspaces';
import { Alert, Button, Checkbox, Dialog, EmptyState, ErrorState, Icon, LoadingCards, Progress, StatusBadge, useToast } from '../../components/ui';
import { t, tx } from '../../i18n';

export default function Projects() {
  useDocumentTitle(t('My Projects'));
  const { data, loading, error, reload } = useQuery(() => projectsApi.mine());
  const jobs = useStore((s) => s.jobs);
  const jobById = useMemo(() => Object.fromEntries(jobs.map((j) => [j.id, j])), [jobs]);
  return (
    <>
      <PageHead title={t('My Projects')} description={t('Projects you have been accepted to. Open a workspace to continue your tasks.')} />
      {loading ? (
        <LoadingCards count={2} />
      ) : error ? (
        <div className="card"><ErrorState onRetry={reload}>{error.message}</ErrorState></div>
      ) : data.length === 0 ? (
        <div className="card">
          <EmptyState icon="folder" title={t('No projects yet')} actions={<><Button to="/app/opportunities">{t('Find opportunities')}</Button><Button to="/app/applications" variant="secondary">{t('View applications')}</Button></>}>
            {t('When one of your applications is accepted, the project will appear here with its workspace and progress.')}
          </EmptyState>
        </div>
      ) : (
        <div className="project-grid">
          {data.map((p) => {
            const job = jobById[p.jobId];
            const cat = categoryById[job.category];
            return (
              <article key={p.id} className="card card-pad project-card">
                <div className="row-between">
                  <span className="row" style={{ gap: 10 }}>
                    <span className="icon-tile sm steel"><Icon name={cat.icon} /></span>
                    <span className="job-cat">{cat.short}</span>
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <h2 className="h-card" style={{ marginTop: 14 }}>{job.title}</h2>
                <div className="row-between xs subtle" style={{ marginTop: 16 }}>
                  <span>{t('{done} of {total} tasks submitted', { done: p.done, total: p.total })}</span>
                  <span>{Math.round((p.done / p.total) * 100)}%</span>
                </div>
                <Progress value={(p.done / p.total) * 100} label={t('{title} progress', { title: job.title })} />
                <dl className="kv" style={{ marginTop: 16 }}>
                  <dt>{t('Started')}</dt><dd>{p.startedAt ? fmtDate(p.startedAt) : t('Not started')}</dd>
                  <dt>{t('Project closes')}</dt><dd>{p.dueAt ? fmtDate(p.dueAt) : t('Ongoing')}</dd>
                </dl>
                <Button to={`/app/projects/${p.id}`} block variant={p.status === 'not_started' ? 'primary' : 'secondary'} style={{ marginTop: 20 }} iconRight="arrowRight">
                  {p.status === 'not_started' ? t('Review agreement & start') : t('Open workspace')}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

export function ProjectWorkspace({ id }) {
  const { data: project, loading, error, reload } = useQuery(() => projectsApi.get(id), [id]);
  const jobs = useStore((s) => s.jobs);
  const job = project && jobs.find((j) => j.id === project.jobId);
  const toast = useToast();
  const [agreeOpen, setAgreeOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(job ? `${t('Workspace')} — ${job.title}` : t('Workspace'));

  if (loading) return <LoadingCards count={2} />;
  if (error) return <div className="card"><ErrorState onRetry={reload}>{error.message}</ErrorState></div>;

  const Workspace = WORKSPACES[job.workspace];
  const start = async () => {
    setBusy(true);
    await projectsApi.start(project.id);
    setBusy(false);
    setAgreeOpen(false);
    toast(t('Agreement acknowledged — your workspace is ready'));
  };
  const finished = project.done >= project.total;

  return (
    <>
      <nav className="breadcrumb" aria-label={t('Breadcrumb')}>
        <Link to="/app/projects">{t('My Projects')}</Link>
        <Icon name="chevronRight" />
        <span>{job.title}</span>
      </nav>
      <div className="ws-head card card-pad">
        <div className="grow">
          <div className="row" style={{ gap: 10 }}>
            <StatusBadge status={project.status} />
            <span className="xs subtle">{categoryById[job.category].name}</span>
          </div>
          <h1>{job.title}</h1>
        </div>
        <div className="ws-progress">
          <span className="small">{tx('{done} / {total} tasks', { done: <strong>{project.done}</strong>, total: project.total })}</span>
          <Progress value={(project.done / project.total) * 100} label={t('Project progress')} />
        </div>
      </div>

      {project.status === 'not_started' ? (
        <div className="card card-pad stack" style={{ marginTop: 20 }}>
          <h2 className="h-card">{t('Review the project agreement to begin')}</h2>
          <p className="small muted">{t('Before starting any task, review the key terms. Compensation details are confirmed in the agreement, not on the listing.')}</p>
          <Button onClick={() => setAgreeOpen(true)} icon="file" style={{ alignSelf: 'flex-start' }}>{t('Review agreement')}</Button>
        </div>
      ) : finished ? (
        <div className="card" style={{ marginTop: 20 }}>
          <EmptyState icon="checkCircle" title={t('All tasks submitted')} actions={<Button to="/app/opportunities" variant="secondary">{t('Find more opportunities')}</Button>}>
            {t('You have submitted every task available for this project.')}
          </EmptyState>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <Alert tone="sand">
            {t('Workspace with sample tasks. Task submissions are saved in this browser for now.')}
          </Alert>
          <div style={{ marginTop: 20 }}>
            <Workspace project={project} job={job} />
          </div>
        </div>
      )}

      <Dialog
        open={agreeOpen}
        onClose={() => setAgreeOpen(false)}
        size="lg"
        title={t('Project agreement — summary')}
        description={job.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAgreeOpen(false)}>{t('Not now')}</Button>
            <Button disabled={!agreed} loading={busy} onClick={start}>{t('Acknowledge & start')}</Button>
          </>
        }
      >
        <ul className="jd-list">
          {AGREEMENT_POINTS.map((p) => <li key={p}><Icon name="check" />{t(p)}</li>)}
        </ul>
        <div style={{ marginTop: 16 }}>
          <Alert tone="info">{t('In production, the full agreement document — including the exact rate — would be displayed here for review and e-signature.')}</Alert>
        </div>
        <div style={{ marginTop: 16 }}>
          <Checkbox label={t('I have read the agreement summary and agree to these terms.')} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        </div>
      </Dialog>
    </>
  );
}
