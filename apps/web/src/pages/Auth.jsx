import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Field, Notice } from '../components/ui';
export function Guard({ children, admin = false }) {
  const { user, loading, error } = useAuth();
  if (loading) return <p className="section">Loading…</p>;
  if (error)
    return (
      <p className="section" role="alert">
        {error}
      </p>
    );
  if (!user) return <Navigate to={admin ? '/admin/login' : '/login'} replace />;
  if (admin && user.role !== 'admin')
    return (
      <section className="section">
        <h1>Administrator access required</h1>
        <Link to="/account">Go to My GVK</Link>
      </section>
    );
  return children;
}
export default function Auth({ signup = false, admin = false }) {
  const { setUser } = useAuth(),
    navigate = useNavigate();
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section className="auth-wrap">
      <div className="auth-intro">
        <span className="eyebrow">YOUR GAME. YOUR JOURNEY.</span>
        <h1>
          {signup ? 'Your next chapter starts with a move.' : 'Welcome back. Let’s keep improving.'}
        </h1>
        <p>Badminton on the court. Chess across the board. One place for everything GVK.</p>
      </div>
      <form
        className="card form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await api('/auth/' + (signup ? 'signup' : 'login'), {
              method: 'POST',
              body: Object.fromEntries(new FormData(e.currentTarget)),
            });
            setUser(r.user);
            if (admin && r.user.role !== 'admin') {
              setMessage('This account is a member account. Use My GVK to continue.');
              return;
            }
            navigate(r.user.role === 'admin' ? '/admin' : '/account');
          } catch (e) {
            setMessage(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>{admin ? 'Admin sign in' : signup ? 'Create your account' : 'Member sign in'}</h2>
        {signup && (
          <Field
            label="Full name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
          />
        )}
        <Field label="Email address" name="email" type="email" autoComplete="email" required />
        <Field
          label={signup ? 'Password (12+ characters)' : 'Password'}
          name="password"
          type="password"
          minLength={signup ? 12 : 1}
          maxLength={128}
          autoComplete={signup ? 'new-password' : 'current-password'}
          required
        />
        <button className="button" disabled={busy}>
          {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
        </button>
        <Notice message={message} />
        {!admin && (
          <p>
            {signup ? 'Already a member?' : 'New to GVK?'}{' '}
            <Link to={signup ? '/login' : '/signup'}>
              {signup ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        )}
      </form>
    </section>
  );
}
