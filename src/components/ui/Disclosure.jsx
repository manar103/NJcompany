import { isRTL } from '../../i18n';
import { useId, useRef, useState } from 'react';
import Icon from './Icon';

/** Accessible tabs (roving arrow-key focus). `tabs` = [{ id, label, count?, content? }]. */
export function Tabs({ tabs, value, onChange, label }) {
  const [inner, setInner] = useState(tabs[0]?.id);
  const active = value ?? inner;
  const set = onChange ?? setInner;
  const base = useId();
  const listRef = useRef(null);
  const onKey = (e) => {
    const i = tabs.findIndex((t) => t.id === active);
    let n = null;
    const fwd = isRTL() ? 'ArrowLeft' : 'ArrowRight';
    const back = isRTL() ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === fwd) n = (i + 1) % tabs.length;
    if (e.key === back) n = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = tabs.length - 1;
    if (n === null) return;
    e.preventDefault();
    set(tabs[n].id);
    listRef.current?.querySelectorAll('[role=tab]')[n]?.focus();
  };
  const current = tabs.find((t) => t.id === active);
  return (
    <div>
      <div className="tabs-list" role="tablist" aria-label={label} ref={listRef} onKeyDown={onKey}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${base}-${t.id}-tab`}
            aria-selected={t.id === active}
            aria-controls={current?.content !== undefined ? `${base}-${t.id}-panel` : undefined}
            tabIndex={t.id === active ? 0 : -1}
            className="tab"
            onClick={() => set(t.id)}
          >
            {t.label}
            {t.count !== undefined && <span className="count">{t.count}</span>}
          </button>
        ))}
      </div>
      {current?.content !== undefined && (
        <div role="tabpanel" id={`${base}-${active}-panel`} aria-labelledby={`${base}-${active}-tab`} style={{ paddingTop: 24 }}>
          {current.content}
        </div>
      )}
    </div>
  );
}

export function Accordion({ items }) {
  const [open, setOpen] = useState(null);
  const base = useId();
  return (
    <div className="accordion">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <div className="accordion-item" key={item.q}>
            <h3 style={{ fontSize: 'inherit' }}>
              <button
                type="button"
                className="accordion-trigger"
                aria-expanded={expanded}
                aria-controls={`${base}-${i}`}
                id={`${base}-${i}-btn`}
                onClick={() => setOpen(expanded ? null : i)}
              >
                {item.q}
                <Icon name="plus" />
              </button>
            </h3>
            <div id={`${base}-${i}`} role="region" aria-labelledby={`${base}-${i}-btn`} hidden={!expanded} className="accordion-panel">
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
