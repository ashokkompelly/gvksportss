import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, CheckCircle2, MapPin, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Field } from './ui';
import { api, date } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function RegistrationDetailsForm({
  initial = {},
  onSave,
  onCancel,
  submitLabel = 'Register now',
}) {
  const [name, setName] = useState(initial.name || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className="registration-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        if (name.trim().length < 2) {
          setError('Enter your full name (at least 2 characters).');
          return;
        }
        if (
          !/^\+?[\d\s()-]+$/.test(phone.trim()) ||
          !/^\d{10,15}$/.test(phone.replace(/\D/g, ''))
        ) {
          setError('Enter a valid phone number with 10 to 15 digits.');
          return;
        }
        setBusy(true);
        setError('');
        try {
          await onSave({ name, phone });
        } catch (error) {
          setError(error.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field
        label="Full name *"
        autoComplete="name"
        required
        minLength={2}
        maxLength={120}
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={busy}
      />
      <Field
        label="Phone number *"
        type="tel"
        autoComplete="tel"
        required
        maxLength={30}
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        disabled={busy}
      />
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="button gold" type="submit" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        <button className="button outline" type="button" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function RegistrationPopup({ event, user, onClose, onSaved }) {
  const dialog = useRef(null);
  const successHeading = useRef(null);
  const headingId = useId();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const opener = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => {
      element.close();
      opener?.focus();
    };
  }, []);
  useEffect(() => {
    if (saved) successHeading.current?.focus();
  }, [saved]);
  const close = () => {
    if (!saving) onClose(saved);
  };
  return createPortal(
    <dialog
      ref={dialog}
      className="registration-modal"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <div className="registration-modal-panel">
        <button
          className="registration-close"
          type="button"
          aria-label="Close registration"
          disabled={saving}
          onClick={close}
        >
          <X size={20} />
        </button>
        {saved ? (
          <div className="registration-success">
            <CheckCircle2 size={56} aria-hidden="true" />
            <span className="eyebrow">YOU'RE ON THE LIST</span>
            <h2 id={headingId} ref={successHeading} tabIndex={-1}>
              Registration successful!
            </h2>
            <p role="status">
              Your registration for <strong>{event.title}</strong> has been saved.
            </p>
            <p>Thank you. We look forward to seeing you!</p>
            <button className="button gold" type="button" onClick={close}>
              Done
            </button>
          </div>
        ) : (
          <>
            <span className="eyebrow">JOIN THE EVENT</span>
            <h2 id={headingId}>Reserve your place</h2>
            <div className="registration-event-summary">
              <h3>{event.title}</h3>
              <p>
                <CalendarDays size={17} aria-hidden="true" />
                {date(event.start)}
              </p>
              {event.location && (
                <p>
                  <MapPin size={17} aria-hidden="true" />
                  {event.location}
                </p>
              )}
            </div>
            <p className="registration-required">All fields are required.</p>
            {event.membersOnly && (
              <p>
                An active membership is required.{' '}
                {!user && (
                  <Link to="/login" onClick={close}>
                    Sign in to your account
                  </Link>
                )}
              </p>
            )}
            <RegistrationDetailsForm
              initial={{ name: user?.name }}
              onCancel={close}
              onSave={async (details) => {
                setSaving(true);
                try {
                  await api('/registrations', {
                    method: 'POST',
                    body: { id: event.id, ...details },
                  });
                  setSaved(true);
                  onSaved();
                } finally {
                  setSaving(false);
                }
              }}
            />
          </>
        )}
      </div>
    </dialog>,
    document.body,
  );
}

export default function EventRegistration({ event, onRegistered }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [registered, setRegistered] = useState(false);
  const closed = new Date(event.start) <= new Date();
  const full = event.remaining < 1;
  return (
    <div className="event-registration">
      {registered ? (
        <p className="notice" role="status">
          Registered for {event.title}. Thank you!
        </p>
      ) : (
        <button
          className="button gold"
          disabled={closed || full}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          {closed ? 'Registration closed' : full ? 'Fully booked' : 'Register now'}
        </button>
      )}
      {open && (
        <RegistrationPopup
          event={event}
          user={user}
          onSaved={() => setRegistered(true)}
          onClose={(saved) => {
            setOpen(false);
            if (saved) onRegistered?.();
          }}
        />
      )}
    </div>
  );
}
