import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

function Toast({ notification, dismiss }) {
  const { id, message, type } = notification;
  useEffect(() => {
    if (type !== 'success') return;
    const timer = window.setTimeout(() => dismiss(id), 2000);
    return () => window.clearTimeout(timer);
  }, [id, type, dismiss]);
  const Icon = type === 'error' ? AlertCircle : CheckCircle;
  return (
    <div className={`toast toast-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={22} aria-hidden="true" />
      <p>{message}</p>
      <button type="button" aria-label="Close notification" onClick={() => dismiss(id)}>
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [, refreshTarget] = useState(0);
  const [dismiss] = useState(
    () => (id) => setNotifications((items) => items.filter((item) => item.id !== id)),
  );
  useEffect(() => {
    const receive = ({ detail }) => setNotifications((items) => [...items, detail]);
    const changed = () => refreshTarget((value) => value + 1);
    window.addEventListener('gvk:notification', receive);
    window.addEventListener('gvk:modal-changed', changed);
    return () => {
      window.removeEventListener('gvk:notification', receive);
      window.removeEventListener('gvk:modal-changed', changed);
    };
  }, []);
  return createPortal(
    <aside className="toast-stack" aria-label="Notifications">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} dismiss={dismiss} />
      ))}
    </aside>,
    document.querySelector('.admin-modal[open] .modal-notifications') || document.body,
  );
}
