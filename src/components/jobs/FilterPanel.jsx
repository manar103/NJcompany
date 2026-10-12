import { useId, useState } from 'react';
import { CATEGORIES, COMPENSATION_TYPES, EXPERIENCE, REGIONS, WORK_TYPES } from '../../data/constants';
import { Checkbox, Icon } from '../ui';
import { t } from '../../i18n';

export const EMPTY_FILTERS = { q: '', categories: [], languages: [], regions: [], experience: [], workTypes: [], compensation: [], sort: 'newest' };

export const FILTER_GROUPS = [
  { key: 'categories', label: 'Category', options: CATEGORIES.map((c) => ({ value: c.id, get label() { return c.short; } })) },
  { key: 'languages', label: 'Language', options: null }, // derived from available jobs
  { key: 'regions', label: 'Country / region', options: REGIONS.filter((r) => r !== 'Global').map((r) => ({ value: r, get label() { return t(r); } })) },
  { key: 'experience', label: 'Experience level', options: EXPERIENCE },
  { key: 'workTypes', label: 'Work type', options: WORK_TYPES },
  { key: 'compensation', label: 'Compensation type', options: COMPENSATION_TYPES },
];

export function optionLabel(key, value) {
  const group = FILTER_GROUPS.find((g) => g.key === key);
  return group?.options?.find((o) => o.value === value)?.label || t(value);
}

function Group({ group, options, selected, counts, onToggle }) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const id = useId();
  const visible = showAll ? options : options.slice(0, 6);
  return (
    <fieldset className="filter-group">
      <legend>
        <button type="button" className="filter-legend" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          {t(group.label)}
          {selected.length > 0 && <span className="filter-count">{selected.length}</span>}
          <Icon name="chevronDown" />
        </button>
      </legend>
      <div id={id} hidden={!open} className="stack-sm">
        {visible.map((o) => (
          <Checkbox key={o.value} label={o.label} checked={selected.includes(o.value)} onChange={() => onToggle(group.key, o.value)} count={counts?.[o.value] ?? undefined} />
        ))}
        {options.length > 6 && (
          <button type="button" className="link-btn small" onClick={() => setShowAll((s) => !s)}>
            {showAll ? t('Show fewer') : t('Show all {n}', { n: options.length })}
          </button>
        )}
      </div>
    </fieldset>
  );
}

/**
 * Sidebar / drawer filter controls. `allJobs` drives the language list and per-option counts.
 */
export default function FilterPanel({ filters, onChange, allJobs = [] }) {
  const languages = [...new Set(allJobs.flatMap((j) => j.languages.map((l) => l.name)))].sort().map((l) => ({ value: l, label: t(l) }));
  const countBy = (key) => {
    const fn = {
      categories: (j) => [j.category],
      languages: (j) => j.languages.map((l) => l.name),
      experience: (j) => [j.experience],
      workTypes: (j) => [j.workType],
      compensation: (j) => [j.compensation.type],
    }[key];
    if (!fn) return null;
    const c = {};
    allJobs.forEach((j) => fn(j).forEach((v) => (c[v] = (c[v] || 0) + 1)));
    return c;
  };
  const toggle = (key, value) => {
    const cur = filters[key];
    onChange({ ...filters, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  };
  return (
    <div className="filter-panel">
      {FILTER_GROUPS.map((g) => (
        <Group key={g.key} group={g} options={g.options || languages} selected={filters[g.key]} counts={countBy(g.key)} onToggle={toggle} />
      ))}
    </div>
  );
}
