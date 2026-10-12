import { t } from '../../i18n';
import { createContext, useCallback, useContext, useState } from 'react';
import Icon from './Icon';
import Button from './Button';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const toast = useCallback((message, { icon = 'checkCircle', duration = 4200 } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, icon }]);
    setTimeout(() => dismiss(id), duration);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((item) => (
          <div className="toast" key={item.id}>
            <Icon name={item.icon} />
            <span>{item.message}</span>
            <button type="button" onClick={() => dismiss(item.id)} aria-label={t('Dismiss notification')}>
              <Icon name="x" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export function Alert({ tone = 'info', title, children, icon }) {
  const icons = { info: 'info', success: 'checkCircle', warning: 'alert', danger: 'alertCircle', sand: 'info' };
  return (
    <div className={`alert alert-${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon name={icon || icons[tone]} />
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, children, actions }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function ErrorState({ title = t('Something went wrong'), children, onRetry }) {
  return (
    <EmptyState
      icon="alertCircle"
      title={title}
      actions={
        onRetry && (
          <Button variant="secondary" icon="refresh" onClick={onRetry}>
            {t('Try again')}
          </Button>
        )
      }
    >
      {children || t('We could not load this content. Check your connection and try again.')}
    </EmptyState>
  );
}

export const Skeleton = ({ w = '100%', h = 14, r, style }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />
);

export function Progress({ value, label, tone }) {
  return (
    <div
      className={`progress ${tone || ''}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Stepper({ steps, current }) {
  return (
    <ol className="stepper" aria-label={t('Progress')}>
      {steps.map((s, i) => (
        <li key={s} data-state={i < current ? 'done' : i === current ? 'current' : 'todo'} aria-current={i === current ? 'step' : undefined}>
          <span className="bar" />
          <span className="label">
            {i + 1}. {s}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Skeleton cards shown while sample data loads. */
export function LoadingCards({ count = 3 }) {
  return (
    <div className="stack" aria-busy="true" aria-label={t('Loading')}>
      {Array.from({ length: count }).map((_, i) => (
        <div className="card card-pad" key={i}>
          <Skeleton w="30%" h={12} />
          <Skeleton w="60%" h={20} style={{ marginTop: 14 }} />
          <Skeleton w="90%" style={{ marginTop: 14 }} />
          <div className="row" style={{ marginTop: 18 }}>
            <Skeleton w={90} h={24} r={99} />
            <Skeleton w={110} h={24} r={99} />
            <Skeleton w={80} h={24} r={99} />
          </div>
        </div>
      ))}
    </div>
  );
}
