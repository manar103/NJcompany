import { locale, t } from '../i18n';

const fmt = (iso, opts) => (iso ? new Intl.DateTimeFormat(locale(), opts).format(new Date(iso)) : '—');
export const fmtDate = (iso) => fmt(iso, { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtShort = (iso) => fmt(iso, { day: 'numeric', month: 'short' });

export function daysUntil(iso) {
  if (!iso) return null;
  const ms = new Date(iso + 'T23:59:59') - new Date();
  return Math.ceil(ms / 86400000);
}

export function relative(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return t('just now');
  if (diff < 3600) return t('{n} min ago', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('{n} h ago', { n: Math.floor(diff / 3600) });
  if (diff < 86400 * 7) return t('{n} d ago', { n: Math.floor(diff / 86400) });
  return fmtDate(iso);
}

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function passwordIssues(pw) {
  const issues = [];
  if (pw.length < 8) issues.push(t('at least 8 characters'));
  if (!/[A-Za-z]/.test(pw)) issues.push(t('a letter'));
  if (!/\d/.test(pw)) issues.push(t('a number'));
  return issues;
}
