import { t } from '../../i18n';
import { STATUS_META } from '../../data/constants';

export function Badge({ tone, dot, children, className = '' }) {
  return <span className={`badge ${tone ? 'badge-' + tone : ''} ${dot ? 'badge-dot' : ''} ${className}`}>{children}</span>;
}

const OTHER_STATUS = { active: 'Active', not_started: 'Not started', completed: 'Completed', paused: 'Paused', in_progress: 'In progress', open: 'Open', closed: 'Closed' };

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: t(OTHER_STATUS[status] || status) };
  return <span className={`badge badge-dot status-${status}`}>{meta.label}</span>;
}

export function SampleBadge({ children = t('Sample data') }) {
  return (
    <span className="badge badge-sample" title={t('Illustrative content — not a real listing')}>
      {children}
    </span>
  );
}
