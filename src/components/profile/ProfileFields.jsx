// Profile editing building blocks shared by onboarding and the profile page.
import { useId, useRef } from 'react';
import { CATEGORIES, LANGUAGES, PROFICIENCY, WORKLOAD } from '../../data/constants';
import { Button, Icon, IconButton, Select } from '../ui';
import { t } from '../../i18n';

export function LanguageEditor({ value, onChange, error }) {
  const used = value.map((l) => l.name);
  const update = (i, patch) => onChange(value.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const add = () => {
    const next = LANGUAGES.find((l) => !used.includes(l));
    onChange([...value, { name: next, level: 'fluent' }]);
  };
  return (
    <div className="stack-sm">
      {value.map((l, i) => (
        <div className="lang-row" key={i}>
          <div className="field grow">
            <label className="sr-only" htmlFor={`lang-${i}`}>{t('Language {n}', { n: i + 1 })}</label>
            <Select id={`lang-${i}`} value={l.name} onChange={(e) => update(i, { name: e.target.value })} options={LANGUAGES.filter((x) => x === l.name || !used.includes(x))} />
          </div>
          <div className="field grow">
            <label className="sr-only" htmlFor={`lvl-${i}`}>{t('Proficiency for {name}', { name: t(l.name) })}</label>
            <Select id={`lvl-${i}`} value={l.level} onChange={(e) => update(i, { level: e.target.value })} options={PROFICIENCY} />
          </div>
          <IconButton icon="trash" label={t('Remove {name}', { name: t(l.name) })} onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      {error && (
        <p className="field-error" role="alert">
          <Icon name="alertCircle" /> {error}
        </p>
      )}
      <Button variant="secondary" size="sm" icon="plus" onClick={add} disabled={value.length >= 8}>
        {t('Add language')}
      </Button>
    </div>
  );
}

/** Multi-select rendered as toggle pills. */
export function TagSelect({ label, options, value, onChange, error, hint }) {
  const id = useId();
  return (
    <fieldset className="field">
      <legend className="field-label" style={{ marginBottom: 6 }}>{label}</legend>
      {hint && <span className="field-hint" style={{ marginBottom: 8 }} id={`${id}-hint`}>{hint}</span>}
      <div className="row" style={{ gap: 8 }}>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const text = typeof o === 'string' ? t(o) : o.label;
          const on = value.includes(v);
          return (
            <button key={v} type="button" className="tag-toggle" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])}>
              {on && <Icon name="check" size={14} style={{ display: 'inline', marginInlineEnd: 4, verticalAlign: '-2px' }} />}
              {text}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="field-error" role="alert" style={{ marginTop: 6 }}>
          <Icon name="alertCircle" /> {error}
        </p>
      )}
    </fieldset>
  );
}

export const INTEREST_OPTIONS = CATEGORIES.map((c) => ({ value: c.id, get label() { return c.short; } }));

export function WorkloadPicker({ value, onChange }) {
  return (
    <fieldset>
      <legend className="field-label" style={{ marginBottom: 8 }}>{t('Preferred workload')}</legend>
      <div className="radio-cards">
        {WORKLOAD.map((w) => (
          <label className="radio-card" key={w.value}>
            <input type="radio" name="workload" value={w.value} checked={value === w.value} onChange={() => onChange(w.value)} />
            <strong>{w.label}</strong>
            <span>{w.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Resume picker. The file is NOT uploaded — only its name is kept, because file storage
 * requires a backend. The UI says so explicitly.
 */
export function ResumePicker({ value, onChange }) {
  const ref = useRef(null);
  const id = useId();
  return (
    <div className="field">
      <span className="field-label" id={id}>{t('Resume / CV')} <span className="opt">({t('optional')})</span></span>
      <div className="file-drop">
        <span className="icon-tile sm steel"><Icon name="file" /></span>
        <div className="grow">
          {value ? <strong className="small">{value}</strong> : <span className="small muted">{t('PDF or DOCX, up to 5 MB')}</span>}
          <p className="xs subtle">{t('Only the file name is saved for now. Files are not uploaded yet.')}</p>
        </div>
        <input
          ref={ref}
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          aria-labelledby={id}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f.size > 5 * 1024 * 1024 ? { error: t('File is larger than 5 MB.') } : f.name);
            e.target.value = '';
          }}
        />
        {value ? (
          <Button variant="ghost" size="sm" onClick={() => onChange('')}>{t('Remove')}</Button>
        ) : (
          <Button variant="secondary" size="sm" icon="upload" onClick={() => ref.current?.click()}>{t('Choose file')}</Button>
        )}
      </div>
    </div>
  );
}
