import { t } from '../../i18n';
import { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

/** Shared modal behaviour: Esc to close, focus trap, focus restore, scroll lock. */
function useModal(open, onClose, ref) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const node = ref.current;
    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE);
    first?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && node) {
        const items = [...node.querySelectorAll(FOCUSABLE)];
        if (!items.length) return;
        const a = items[0];
        const z = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, ref]);
}

export function Dialog({ open, onClose, title, description, children, footer, size }) {
  const ref = useRef(null);
  const id = useId();
  useModal(open, onClose, ref);
  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`dialog ${size === 'lg' ? 'dialog-lg' : ''}`} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="dialog-header">
          <div>
            <h2 id={id}>{title}</h2>
            {description && (
              <p className="small muted" style={{ marginTop: 6 }}>
                {description}
              </p>
            )}
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t('Close dialog')}>
            <Icon name="x" />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, label, side = 'start', children }) {
  const ref = useRef(null);
  useModal(open, onClose, ref);
  if (!open) return null;
  return createPortal(
    <div className={`overlay drawer-overlay ${side}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="drawer" role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/** Menu button with outside-click / Esc dismissal and arrow-key navigation. */
export function Dropdown({ trigger, children, align = 'right', label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector('button')?.focus();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...ref.current.querySelectorAll('.menu-item')];
        const i = items.indexOf(document.activeElement);
        const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('.menu-item')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="dropdown" ref={ref}>
      {trigger({ 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': open ? id : undefined, onClick: () => setOpen((o) => !o) })}
      {open && (
        <div
          className="menu"
          id={id}
          role="menu"
          aria-label={label}
          style={align === 'left' ? { insetInlineStart: 0, insetInlineEnd: 'auto' } : undefined}
          onClick={(e) => e.target.closest('.menu-item') && setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
