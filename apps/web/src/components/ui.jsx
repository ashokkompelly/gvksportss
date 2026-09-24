import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Eye, EyeOff } from 'lucide-react';
export function useData(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState('');
  const [version, refresh] = useState(0);
  const previousPath = useRef(path);
  useEffect(() => {
    let live = true;
    setError('');
    if (previousPath.current !== path) {
      setData(null);
      previousPath.current = path;
    }
    api(path)
      .then((v) => {
        if (live) setData(v);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [path, version]);
  useEffect(() => {
    const refreshContent = () => refresh((v) => v + 1);
    window.addEventListener('gvk:content-updated', refreshContent);
    window.addEventListener('focus', refreshContent);
    return () => {
      window.removeEventListener('gvk:content-updated', refreshContent);
      window.removeEventListener('focus', refreshContent);
    };
  }, []);
  return { data, error, reload: () => refresh((v) => v + 1) };
}
export function State({ data, error, children }) {
  if (error)
    return (
      <p role="alert" className="notice error">
        {error}
      </p>
    );
  if (data === null)
    return (
      <p className="notice" role="status">
        Loading…
      </p>
    );
  return children;
}
export function Heading({ eyebrow, title, children }) {
  return (
    <div className="heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}
export function Field({ label, ...props }) {
  const [visible, setVisible] = useState(false);
  const password = props.type === 'password';
  return (
    <label className="field">
      <span>{label}</span>
      <span className={password ? 'password-input' : undefined}>
        <input {...props} type={password && visible ? 'text' : props.type} />
        {password && (
          <button
            type="button"
            className="password-toggle"
            aria-label={visible ? 'Hide password' : 'Show password'}
            title={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
    </label>
  );
}
export function Notice({ message }) {
  return message ? (
    <p className="notice" role="status">
      {message}
    </p>
  ) : null;
}
export function Action({ onClick, children, className = 'button', ...props }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      {...props}
      className={className}
      disabled={props.disabled || busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Please wait…' : children}
    </button>
  );
}
