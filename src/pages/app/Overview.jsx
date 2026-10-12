import { useMemo } from 'react';
import { Link } from '../../lib/router';
import { useDocumentTitle, useSession, useStore } from '../../lib/hooks';
import { profileCompletion } from '../../services/api';
import { categoryById, STATUS_META } from '../../data/constants';
import { daysUntil, fmtShort, relative } from '../../lib/format';
import JobCard from '../../components/jobs/JobCard';
import { Alert, Button, EmptyState, Icon, Progress, StatusBadge } from '../../components/ui';
import { locale, t } from '../../i18n';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? t('Good morning') : h < 18 ? t('Good afternoon') : t('Good evening');
};

function Stat({ icon, label, value, to }) {
  return (
    <Link to={to} className="stat card card-interactive">
      <span className="icon-tile sm steel">
        <Icon name={icon} />
      </span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </Link>
  );
}

export default function Overview() {
  useDocumentTitle(t('Dashboard'));
  const user = useSession();
  const allApps = useStore((s) => s.applications);
  const allProjects = useStore((s) => s.projects);
  const allNotes = useStore((s) => s.notifications);
  const jobs = useStore((s) => s.jobs);
  const jobById = useMemo(() => Object.fromEntries(jobs.map((j) => [j.id, j])), [jobs]);

  const apps = allApps.filter((a) => a.userId === user.id);
  const projects = allProjects.filter((p) => p.userId === user.id);
  const notes = allNotes.filter((n) => n.userId === user.id || n.userId === '*').sort((a, b) => b.at.localeCompare(a.at));
  const completion = profileCompletion(user);
  const name = user.profile?.fullName?.split(' ')[0];

  const active = apps.filter((a) => ['submitted', 'under_review', 'assessment_required', 'draft'].includes(a.status));
  const assessmentsDue = apps.filter((a) => a.status === 'assessment_required');
  const activeProjects = projects.filter((p) => p.status !== 'completed');
  const recent = [...apps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  const myLangs = (user.profile?.languages || []).map((l) => l.name);
  const appliedIds = new Set(apps.map((a) => a.jobId));
  const recommended = jobs
    .filter((j) => j.status === 'open' && !appliedIds.has(j.id))
    .map((j) => ({ j, score: (j.languages.some((l) => myLangs.includes(l.name)) ? 2 : 0) + ((user.profile?.interests || []).includes(j.category) ? 1 : 0) }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.j);

  const upcoming = [
    ...assessmentsDue.map((a) => ({ id: a.id, icon: 'target', title: jobById[a.jobId]?.assessment?.name || t('Assessment'), sub: jobById[a.jobId]?.title, to: `/app/assessments/${a.id}`, tag: t('Assessment due') })),
    ...[...apps.filter((a) => a.status === 'draft'), ...activeProjects]
      .map((x) => ({ x, job: jobById[x.jobId] }))
      .filter(({ job }) => job?.deadline && daysUntil(job.deadline) >= 0 && daysUntil(job.deadline) <= 45)
      .map(({ x, job }) => ({ id: x.id, icon: 'calendar', title: job.title, sub: t(x.applicationId ? 'Project closes {date}' : 'Application deadline {date}', { date: fmtShort(job.deadline) }), to: x.applicationId ? `/app/projects/${x.id}` : `/opportunities/${job.id}`, tag: t('{n} days', { n: daysUntil(job.deadline) }) })),
  ].slice(0, 4);

  return (
    <div className="dash">
      <div className="dash-welcome">
        <div>
          <p className="small subtle">{new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>
            {greeting()}
            {name ? `${t(',')} ${name}` : ''}
          </h1>
          <p className="muted small" style={{ marginTop: 4 }}>
            {t('Here’s what’s happening with your applications and projects.')}
          </p>
        </div>
        <Button to="/app/opportunities" icon="search">
          {t('Find opportunities')}
        </Button>
      </div>

      {!user.onboarded && (
        <div style={{ marginBottom: 24 }}>
          <Alert tone="warning" title={t('Finish setting up your profile')}>
            {t('You need a complete profile before applying.')} <Link to="/onboarding">{t('Continue setup →')}</Link>
          </Alert>
        </div>
      )}

      <div className="stat-grid">
        <Stat icon="clipboard" label={t('Open applications')} value={active.length} to="/app/applications" />
        <Stat icon="target" label={t('Assessments to complete')} value={assessmentsDue.length} to="/app/assessments" />
        <Stat icon="folder" label={t('Active projects')} value={activeProjects.length} to="/app/projects" />
        <Stat icon="bell" label={t('Unread notifications')} value={notes.filter((n) => !n.read).length} to="/app/notifications" />
      </div>

      <div className="dash-grid">
        <div className="dash-col">
          <section className="card" aria-labelledby="recent-h">
            <div className="card-header">
              <h2 id="recent-h">{t('Recent applications')}</h2>
              {recent.length > 0 && <Link to="/app/applications" className="small">{t('View all')}</Link>}
            </div>
            {recent.length === 0 ? (
              <EmptyState icon="clipboard" title={t('No applications yet')} actions={<Button to="/app/opportunities" variant="secondary">{t('Browse opportunities')}</Button>}>
                {t('When you apply to an opportunity, you can follow its progress here.')}
              </EmptyState>
            ) : (
              <ul className="list">
                {recent.map((a) => (
                  <li key={a.id}>
                    <Link to={`/app/applications/${a.id}`} className="list-row">
                      <span className="icon-tile sm">
                        <Icon name={categoryById[jobById[a.jobId]?.category]?.icon || 'briefcase'} />
                      </span>
                      <span className="grow">
                        <span className="list-title">{jobById[a.jobId]?.title}</span>
                        <span className="list-sub">{STATUS_META[a.status].next}</span>
                      </span>
                      <StatusBadge status={a.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" aria-labelledby="proj-h">
            <div className="card-header">
              <h2 id="proj-h">{t('Current projects')}</h2>
              {projects.length > 0 && <Link to="/app/projects" className="small">{t('View all')}</Link>}
            </div>
            {activeProjects.length === 0 ? (
              <EmptyState icon="folder" title={t('No active projects')}>
                {t('Projects appear here once an application is accepted.')}
              </EmptyState>
            ) : (
              <ul className="list">
                {activeProjects.map((p) => (
                  <li key={p.id}>
                    <Link to={`/app/projects/${p.id}`} className="list-row">
                      <span className="grow">
                        <span className="list-title">{jobById[p.jobId]?.title}</span>
                        <span className="row" style={{ gap: 10, marginTop: 8 }}>
                          <span style={{ flex: 1, maxWidth: 280 }}>
                            <Progress value={(p.done / p.total) * 100} label={t('{title} progress', { title: jobById[p.jobId]?.title })} />
                          </span>
                          <span className="xs subtle">{t('{done}/{total} tasks', { done: p.done, total: p.total })}</span>
                        </span>
                      </span>
                      <StatusBadge status={p.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="rec-h">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <h2 id="rec-h" className="h-sec">{t('Recommended for you')}</h2>
              <Link to="/app/opportunities" className="small">{t('See all')}</Link>
            </div>
            {recommended.length === 0 ? (
              <div className="card">
                <EmptyState icon="compass" title={t('No recommendations yet')} actions={<Button to="/app/profile" variant="secondary">{t('Update languages')}</Button>}>
                  {t('Add your languages and interests to see opportunities that match your profile.')}
                </EmptyState>
              </div>
            ) : (
              <div className="job-grid three">
                {recommended.map((j) => (
                  <JobCard key={j.id} job={j} compact basePath="/app/opportunities" />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dash-col">
          <section className="card card-pad profile-card" aria-labelledby="pc-h">
            <div className="row-between">
              <h2 id="pc-h" className="h-card">{t('Profile completion')}</h2>
              <span className="pc-value">{completion}%</span>
            </div>
            <Progress value={completion} label={t('Profile completion')} tone="sand" />
            <p className="small muted">{completion === 100 ? t('Your profile is complete. Keep your languages and availability up to date.') : t('A complete profile helps reviewers match you with the right projects.')}</p>
            <Button to="/app/profile" variant="secondary" size="sm" block>
              {completion === 100 ? t('View profile') : t('Complete profile')}
            </Button>
          </section>

          <section className="card" aria-labelledby="up-h">
            <div className="card-header">
              <h2 id="up-h">{t('Upcoming')}</h2>
            </div>
            {upcoming.length === 0 ? (
              <p className="small subtle card-body">{t('No assessments or deadlines coming up.')}</p>
            ) : (
              <ul className="list">
                {upcoming.map((u) => (
                  <li key={u.id + u.icon}>
                    <Link to={u.to} className="list-row">
                      <span className="icon-tile sm sand">
                        <Icon name={u.icon} />
                      </span>
                      <span className="grow">
                        <span className="list-title">{u.title}</span>
                        <span className="list-sub">{u.sub}</span>
                      </span>
                      <span className="xs subtle nowrap">{u.tag}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" aria-labelledby="nt-h">
            <div className="card-header">
              <h2 id="nt-h">{t('Notifications')}</h2>
              <Link to="/app/notifications" className="small">{t('View all')}</Link>
            </div>
            {notes.length === 0 ? (
              <p className="small subtle card-body">{t('You’re all caught up.')}</p>
            ) : (
              <ul className="list">
                {notes.slice(0, 4).map((n) => (
                  <li key={n.id}>
                    <Link to={n.link || '/app/notifications'} className="list-row">
                      {!n.read && <span className="unread-dot" aria-label={t('Unread')} />}
                      <span className="grow">
                        <span className="list-title">{t(n.title)}</span>
                        <span className="list-sub">{t(n.body)}</span>
                      </span>
                      <span className="xs subtle nowrap">{relative(n.at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
