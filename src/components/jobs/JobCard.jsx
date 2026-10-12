import { Link } from '../../lib/router';
import { categoryById, compensationLabel, experienceLabel, proficiencyLabel, workTypeLabel } from '../../data/constants';
import { daysUntil, fmtShort } from '../../lib/format';
import { Badge, Button, Icon } from '../ui';
import { t } from '../../i18n';

export function DeadlineText({ deadline }) {
  if (!deadline) return <>{t('Rolling — no fixed deadline')}</>;
  const d = daysUntil(deadline);
  if (d < 0) return <>{t('Closed {date}', { date: fmtShort(deadline) })}</>;
  return (
    <>
      {t('Apply by {date}', { date: fmtShort(deadline) })}
      {d <= 14 && <span className="deadline-soon"> · {d === 0 ? t('today') : t('{n} days left', { n: d })}</span>}
    </>
  );
}

export function LanguageList({ languages, withLevel = true }) {
  return languages.map((l) => `${t(l.name)}${withLevel ? ` (${proficiencyLabel[l.level]})` : ''}`).join(t(', '));
}

/** Opportunity summary card. `basePath` switches between public and dashboard routes. */
export default function JobCard({ job, basePath = '/opportunities', compact = false, applied }) {
  const cat = categoryById[job.category];
  const href = `${basePath}/${job.id}`;
  return (
    <article className={`card card-interactive job-card ${compact ? 'compact' : ''}`}>
      <div className="job-card-top">
        <span className="icon-tile sm steel">
          <Icon name={cat.icon} />
        </span>
        <span className="job-cat">{cat.short}</span>
        {applied && (
          <Badge tone="steel" className="ml-auto">
            {t('Applied')}
          </Badge>
        )}
      </div>
      <h3 className="job-title">
        <Link to={href} className="stretched">
          {job.title}
        </Link>
      </h3>
      {!compact && <p className="job-summary">{job.summary}</p>}
      <ul className="job-meta" aria-label={t('Opportunity details')}>
        <li>
          <Icon name="globe" />
          <span className="sr-only">{t('Languages:')} </span>
          <LanguageList languages={job.languages} withLevel={!compact} />
        </li>
        <li>
          <Icon name="briefcase" />
          {workTypeLabel[job.workType]}
        </li>
        <li>
          <Icon name="clock" />
          {job.commitment}
        </li>
        {!compact && (
          <li>
            <Icon name="wallet" />
            {compensationLabel[job.compensation.type]}
          </li>
        )}
      </ul>
      <div className="job-card-foot">
        <div className="row" style={{ gap: 8 }}>
          <Badge tone="outline">{experienceLabel[job.experience]}</Badge>
          {job.assessment?.required && <Badge tone="sand">{t('Assessment')}</Badge>}
        </div>
        <span className="job-deadline">
          <Icon name="calendar" />
          <DeadlineText deadline={job.deadline} />
        </span>
      </div>
      {!compact && (
        <div className="job-card-cta">
          <Button to={href} variant="secondary" size="sm" iconRight="arrowRight" tabIndex={-1} aria-hidden="true">
            {t('View Details')}
          </Button>
        </div>
      )}
    </article>
  );
}
