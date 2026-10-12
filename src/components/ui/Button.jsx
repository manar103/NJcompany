import { Link } from '../../lib/router';
import Icon from './Icon';

const cls = (variant, size, block, extra) =>
  ['btn', variant && variant !== 'primary' && `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', extra]
    .filter(Boolean)
    .join(' ');

/** Button that renders a router link when `to` is given. */
export default function Button({ variant = 'primary', size, block, to, icon, iconRight, loading, children, className, type = 'button', ...rest }) {
  const content = (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon && <Icon name={icon} />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} />}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls(variant, size, block, className)} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={cls(variant, size, block, className)} disabled={loading || rest.disabled} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}

export function IconButton({ icon, label, variant = 'ghost', className = '', ...rest }) {
  return (
    <button type="button" className={`btn btn-${variant} btn-icon ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} />
    </button>
  );
}
