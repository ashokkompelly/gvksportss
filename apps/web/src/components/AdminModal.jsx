import { cloneElement, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function AdminModal({ title, children, onClose, busy = false, dirty = false }) {
  const ref = useRef(null);
  const changed = useRef(false);
  const heading = useId();
  const close = () => {
    if (
      busy ||
      ref.current?.querySelector(
        '[data-saving="true"], button[type="submit"]:disabled, .content-save-bar button:disabled',
      )
    )
      return;
    if ((dirty || changed.current) && !window.confirm('Discard unsaved changes?')) return;
    onClose();
  };
  useEffect(() => {
    const opener = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    window.dispatchEvent(new Event('gvk:modal-changed'));
    return () => {
      dialog.close();
      opener?.focus();
      queueMicrotask(() => window.dispatchEvent(new Event('gvk:modal-changed')));
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="admin-modal"
      aria-labelledby={heading}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
    >
      <div
        className="admin-modal-panel"
        onChangeCapture={() => {
          changed.current = true;
        }}
      >
        <div className="admin-modal-heading">
          <h2 id={heading}>{title}</h2>
          <button type="button" aria-label="Close editor" onClick={close}>
            <X size={22} />
          </button>
        </div>
        <div className="admin-modal-content">{cloneElement(children, { onClose: close })}</div>
        <div className="modal-notifications" />
      </div>
    </dialog>,
    document.body,
  );
}
