import { t } from '../../i18n';
import { useId, useState, cloneElement } from 'react';
import Icon from './Icon';

/**
 * Field wires label, hint and error to its single control child
 * (id, aria-describedby, aria-invalid) so every input is accessible by default.
 */
export function Field({ label, hint, error, optional, children, className = '' }) {
  const id = useId();
  const controlId = children.props.id || id;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const control = cloneElement(children, {
    id: controlId,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': [hintId, errId].filter(Boolean).join(' ') || undefined,
  });
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field-label" htmlFor={controlId}>
          {label} {optional && <span className="opt">({t('optional')})</span>}
        </label>
      )}
      {control}
      {hint && (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={errId} role="alert">
          <Icon name="alertCircle" /> {error}
        </span>
      )}
    </div>
  );
}

export const Input = (props) => <input className="input" {...props} />;
export const Textarea = (props) => <textarea className="textarea" {...props} />;

export function Select({ options, placeholder, ...props }) {
  return (
    <select className="select" {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const value = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? t(o) : o.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

/** Password field with show/hide toggle. Extra props land on the <input>. */
export function PasswordInput({ id, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-group">
      <Icon name="lock" />
      <input id={id} className="input" type={show ? 'text' : 'password'} style={{ paddingInlineEnd: 48 }} {...props} />
      <button
        type="button"
        className="btn btn-ghost btn-icon btn-sm input-action"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? t('Hide password') : t('Show password')}
        aria-pressed={show}
      >
        <Icon name={show ? 'eyeOff' : 'eye'} />
      </button>
    </div>
  );
}

export function Checkbox({ label, count, ...props }) {
  return (
    <label className="check">
      <input type="checkbox" {...props} />
      <span>{label}</span>
      {count !== undefined && <span className="count">{count}</span>}
    </label>
  );
}

export function Switch({ label, description, ...props }) {
  const id = useId();
  return (
    <div className="row-between" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
      <div>
        <label htmlFor={id} className="field-label" style={{ cursor: 'pointer' }}>
          {label}
        </label>
        {description && <p className="small subtle">{description}</p>}
      </div>
      <span className="switch">
        <input id={id} type="checkbox" role="switch" {...props} />
        <span />
      </span>
    </div>
  );
}
