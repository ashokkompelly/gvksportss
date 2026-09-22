import { useEffect, useState } from 'react';
import { api } from '../lib/api';
export function useData(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState('');
  const [version, refresh] = useState(0);
  useEffect(() => {
    let live = true;
    setError('');
    setData(null);
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
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
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
