import { useEffect, useState } from 'react';
import { Link, navigate, useLocation } from '../../lib/router';
import { useDocumentTitle, useQuery, useSession, useStore } from '../../lib/hooks';
import { jobs as jobsApi } from '../../services/api';
import { categoryById, compensationLabel, experienceLabel, proficiencyLabel, workTypeLabel } from '../../data/constants';
import { fmtDate } from '../../lib/format';
import { DeadlineText } from '../../components/jobs/JobCard';
import ApplyDialog from '../../components/jobs/ApplyDialog';
import { Accordion, Alert, Badge, Button, ErrorState, Icon, SampleBadge, Skeleton, StatusBadge } from '../../components/ui';
import { t } from '../../i18n';

function Section({ title, icon, children }) {
  return (
    <section className="jd-section">
      <h2>
        {icon && <Icon name={icon} />}
        {title}
      </h2>
      {children}
    </section>
  );
}

const List = ({ items, icon = 'check' }) => (
  <ul className="jd-list">
    {items.map((i) => (
      <li key={i}>
        <Icon name={icon} />
        {i}
      </li>
    ))}
  </ul>
);

export default function JobDetail({ id, inApp = false }) {
  const { query } = useLocation();
  const { data: job, loading, error, reload } = useQuery(() => jobsApi.get(id), [id]);
  const user = useSession();
  const apps = useStore((s) => s.applications);
  const [applyOpen, setApplyOpen] = useState(false);
  useDocumentTitle(job?.title || t('Opportunity'));

  const myApp = user && apps.find((a) => a.jobId === id && a.userId === user.id && a.status !== 'withdrawn');
  const base = inApp ? '/app/opportunities' : '/opportunities';

  const startApply = () => {
    const back = `/opportunities/${id}?apply=1`;
    if (!user) return navigate(`/login?next=${encodeURIComponent(back)}`);
    if (user.role === 'admin') return;
    if (!user.onboarded) return navigate(`/onboarding?next=${encodeURIComponent(back)}`);
    setApplyOpen(true);
  };

  // Resume the apply flow after login / onboarding redirects.
  useEffect(() => {
    if (job && query.get('apply') === '1' && user?.onboarded && (!myApp || myApp.status === 'draft')) setApplyOpen(true);
  }, [job]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading)
    return (
      <div className={inApp ? '' : 'container jd-wrap'}>
        <Skeleton w={120} h={14} />
        <Skeleton w="60%" h={34} style={{ marginTop: 16 }} />
        <Skeleton w="80%" style={{ marginTop: 16 }} />
        <div className="jd-layout" style={{ marginTop: 32 }}>
          <div className="stack">
            <Skeleton h={160} r={14} />
            <Skeleton h={220} r={14} />
          </div>
          <Skeleton h={320} r={14} />
        </div>
      </div>
    );

  if (error)
    return (
      <div className={inApp ? '' : 'container jd-wrap'}>
        <div className="card">
          <ErrorState title={t('Opportunity unavailable')} onRetry={reload}>
            {error.message}
          </ErrorState>
          <div className="row" style={{ justifyContent: 'center', paddingBottom: 32 }}>
            <Button to={base} variant="ghost" icon="arrowLeft">
              {t('Back to opportunities')}
            </Button>
          </div>
        </div>
      </div>
    );

  const cat = categoryById[job.category];
  const applyCta = myApp ? (
    myApp.status === 'draft' ? (
      <Button block size="lg" onClick={startApply}>
        {t('Continue draft application')}
      </Button>
    ) : (
      <Button block size="lg" variant="secondary" to={`/app/applications/${myApp.id}`}>
        {t('View your application')}
      </Button>
    )
  ) : user?.role === 'admin' ? (
    <Button block size="lg" variant="secondary" to="/admin/jobs">
      {t('Manage in admin')}
    </Button>
  ) : (
    <Button block size="lg" iconRight="arrowRight" onClick={startApply}>
      {t('Apply Now')}
    </Button>
  );

  return (
    <div className={inApp ? '' : 'jd-page'}>
      <div className={inApp ? '' : 'container jd-wrap'}>
        <nav aria-label={t('Breadcrumb')} className="breadcrumb">
          <Link to={base}>{t('Opportunities')}</Link>
          <Icon name="chevronRight" />
          <Link to={`${base}?category=${cat.id}`}>{cat.short}</Link>
        </nav>

        <header className="jd-head">
          <div className="row" style={{ gap: 10 }}>
            <span className="icon-tile steel">
              <Icon name={cat.icon} />
            </span>
            <span className="job-cat">{cat.name}</span>
            <SampleBadge>{t('Sample listing')}</SampleBadge>
          </div>
          <h1>{job.title}</h1>
          <p className="jd-summary">{job.summary}</p>
          <div className="row" style={{ gap: 8 }}>
            <Badge tone="outline">{experienceLabel[job.experience]}</Badge>
            <Badge tone="outline">{workTypeLabel[job.workType]}</Badge>
            {job.regions.map((r) => (
              <Badge tone="outline" key={r}>
                {t(r)}
              </Badge>
            ))}
            <span className="small subtle">{t('Posted {date}', { date: fmtDate(job.postedAt) })}</span>
          </div>
        </header>

        <div className="jd-layout">
          <div className="jd-main">
            <Section title={t('Project overview')}>
              <p className="jd-text">{job.overview}</p>
            </Section>

            <Section title={t('Responsibilities')}>
              <List items={job.responsibilities} icon="chevronRight" />
            </Section>

            <Section title={t('Eligibility')}>
              <div className="req-grid">
                <div className="req-box required">
                  <h3>
                    <Badge tone="steel">{t('Required')}</Badge> {t('Mandatory requirements')}
                  </h3>
                  <List items={job.mandatory} />
                </div>
                <div className="req-box">
                  <h3>
                    <Badge tone="outline">{t('Preferred')}</Badge> {t('Nice to have')}
                  </h3>
                  {job.preferred.length ? <List items={job.preferred} icon="plus" /> : <p className="small subtle">{t('No additional preferences listed.')}</p>}
                </div>
              </div>
            </Section>

            <Section title={t('Languages & proficiency')}>
              <div className="table-wrap card" style={{ boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">{t('Language')}</th>
                      <th scope="col">{t('Minimum level')}</th>
                      <th scope="col">{t('Notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.languages.map((l) => (
                      <tr key={l.name}>
                        <td className="t-strong">{t(l.name)}</td>
                        <td>{proficiencyLabel[l.level]}</td>
                        <td className="subtle">{l.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {job.equipment.length > 0 && (
              <Section title={t('Equipment & technical requirements')}>
                <List items={job.equipment} icon="settings" />
              </Section>
            )}

            <Section title={t('Compensation & payment conditions')}>
              <div className="kv-card">
                <dl className="kv">
                  <dt>{t('Compensation type')}</dt>
                  <dd>{compensationLabel[job.compensation.type]}</dd>
                </dl>
                <p className="small muted" style={{ marginTop: 10 }}>
                  {job.compensation.details}
                </p>
              </div>
            </Section>

            <Section title={t('Assessment')}>
              {job.assessment?.required ? (
                <Alert tone="sand" title={t('{name} · about {duration}', { name: job.assessment.name, duration: job.assessment.duration })} icon="target">
                  {t('After you apply, you will be asked to complete this assessment. It checks the specific skills the project needs. Your progress is saved so you can finish later.')}
                </Alert>
              ) : (
                <p className="jd-text">{t('No assessment is required for this project. Applications are reviewed directly.')}</p>
              )}
            </Section>

            <Section title={t('How to apply')}>
              <ol className="jd-steps">
                {job.steps.map((s, i) => (
                  <li key={s}>
                    <span>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </Section>

            {job.faqs.length > 0 && (
              <Section title={t('Project FAQ')}>
                <Accordion items={job.faqs} />
              </Section>
            )}
          </div>

          <aside className="jd-aside" aria-label={t('Application summary')}>
            <div className="card card-pad jd-apply">
              {myApp && (
                <div className="row-between" style={{ marginBottom: 12 }}>
                  <span className="small subtle">{t('Your application')}</span>
                  <StatusBadge status={myApp.status} />
                </div>
              )}
              <dl className="jd-facts">
                <div>
                  <dt><Icon name="calendar" /> {t('Deadline')}</dt>
                  <dd><DeadlineText deadline={job.deadline} /></dd>
                </div>
                <div>
                  <dt><Icon name="clock" /> {t('Time commitment')}</dt>
                  <dd>{job.commitment}</dd>
                </div>
                <div>
                  <dt><Icon name="briefcase" /> {t('Work type')}</dt>
                  <dd>{workTypeLabel[job.workType]} · {t('Remote')}</dd>
                </div>
                <div>
                  <dt><Icon name="wallet" /> {t('Compensation')}</dt>
                  <dd>{compensationLabel[job.compensation.type]}</dd>
                </div>
                <div>
                  <dt><Icon name="target" /> {t('Assessment')}</dt>
                  <dd>{job.assessment?.required ? t('Required · {duration}', { duration: job.assessment.duration }) : t('Not required')}</dd>
                </div>
              </dl>
              {applyCta}
              <p className="xs subtle" style={{ marginTop: 12, textAlign: 'center' }}>
                {t('Applying does not guarantee acceptance. Project availability may change.')}
              </p>
            </div>
          </aside>
        </div>
      </div>
      <div className="jd-mobile-cta">{applyCta}</div>
      {applyOpen && <ApplyDialog job={job} open={applyOpen} onClose={() => setApplyOpen(false)} draft={myApp?.status === 'draft' ? myApp : null} />}
    </div>
  );
}
