import { LANGS, setLang, t, useLang } from '../../i18n';
import { setTheme, useTheme } from '../../lib/theme';
import { Dropdown, Icon } from '../ui';

/** Switches between English and Arabic (the label shows the language you will switch to). */
export function LanguageToggle({ className = '' }) {
  const lang = useLang();
  const other = LANGS.find((l) => l.id !== lang);
  return (
    <button type="button" className={`btn btn-ghost btn-sm pref-btn ${className}`} onClick={() => setLang(other.id)} lang={other.id} aria-label={t('Switch language to {name}', { name: other.label })}>
      <Icon name="globe" />
      <span>{other.label}</span>
    </button>
  );
}

const THEMES = [
  { id: 'light', label: 'Light', icon: 'sun' },
  { id: 'dark', label: 'Dark', icon: 'moon' },
  { id: 'system', label: 'System', icon: 'monitor' },
];

export function ThemeToggle({ className = '' }) {
  const { choice, theme } = useTheme();
  return (
    <Dropdown
      label={t('Theme')}
      trigger={(p) => (
        <button type="button" className={`btn btn-ghost btn-icon pref-btn ${className}`} aria-label={t('Theme')} title={t('Theme')} {...p}>
          <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
        </button>
      )}
    >
      {THEMES.map((th) => (
        <button key={th.id} type="button" role="menuitemradio" aria-checked={choice === th.id} className="menu-item" onClick={() => setTheme(th.id)}>
          <Icon name={th.icon} /> {t(th.label)}
          {choice === th.id && <Icon name="check" className="menu-check" />}
        </button>
      ))}
    </Dropdown>
  );
}

export default function Preferences({ className = '' }) {
  return (
    <div className={`prefs ${className}`}>
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );
}
