// VERALINK mark: two converging arms (human talent + AI systems) linked through
// network nodes into a "V", meeting at a warm-sand node — the point of contribution.
export function LogoMark({ size = 32, variant = 'navy', title }) {
  const tile = variant === 'navy' ? '#1B263B' : variant === 'light' ? '#FFFFFF' : 'none';
  const left = variant === 'light' ? '#1B263B' : '#FFFFFF';
  const right = '#778DA9';
  const outline = variant === 'mono';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      style={{ flex: 'none' }}
    >
      {title && <title>{title}</title>}
      {!outline && <rect width="32" height="32" rx="8" fill={tile} />}
      <path d="M8.5 9.5 16 23" stroke={outline ? 'currentColor' : left} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M23.5 9.5 16 23" stroke={outline ? 'currentColor' : right} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="8.5" cy="9.5" r="2.6" fill={outline ? 'var(--white)' : tile} stroke={outline ? 'currentColor' : left} strokeWidth="1.8" />
      <circle cx="23.5" cy="9.5" r="2.6" fill={outline ? 'var(--white)' : tile} stroke={outline ? 'currentColor' : right} strokeWidth="1.8" />
      <circle cx="16" cy="23" r="3" fill="#DDBEA9" />
    </svg>
  );
}

export default function Logo({ light = false, size = 32, wordmark = true, suffix }) {
  return (
    <span className={'logo' + (light ? ' light' : '')}>
      <LogoMark size={size} variant={light ? 'light' : 'navy'} />
      {wordmark && <span className="logo-word">VERALINK</span>}
      {suffix}
    </span>
  );
}
