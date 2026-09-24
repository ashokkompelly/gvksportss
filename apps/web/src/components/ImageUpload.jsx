import { useEffect, useId, useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';
import { notify } from '../lib/notifications';

export default function ImageUpload({
  value = '',
  onChange,
  name,
  label = 'Image',
  required = false,
  disabled = false,
}) {
  const id = useId();
  const root = useRef(null);
  const input = useRef(null);
  const uploadButton = useRef(null);
  const active = useRef(null);
  const pending = useRef(false);
  const change = useRef(onChange);
  change.current = onChange;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState('');
  useEffect(() => {
    const form = root.current.closest('form');
    const blockSave = (event) => {
      if (!pending.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      notify('Please wait for the image upload to finish before saving.', 'error');
    };
    form?.addEventListener('submit', blockSave, true);
    return () => {
      form?.removeEventListener('submit', blockSave, true);
      active.current?.abort();
    };
  }, []);
  const upload = async (file) => {
    if (!file) return;
    if (!/\.(jpe?g|png|webp)$/i.test(file.name) || file.size > 10 * 1024 * 1024 || !file.size) {
      notify('Choose a JPG, PNG or WebP image, up to 10 MB.', 'error');
      input.current.value = '';
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    pending.current = true;
    setBusy(true);
    setStatus('Uploading image…');
    try {
      const result = await api('/admin/uploads', {
        method: 'POST',
        body: file,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      change.current(result.url);
      setFailed('');
      setStatus('Image uploaded. Save changes to publish it.');
    } catch (error) {
      if (!controller.signal.aborted) setStatus('Upload failed. Your previous image is unchanged.');
    } finally {
      pending.current = false;
      if (!controller.signal.aborted) {
        setBusy(false);
        input.current.value = '';
      }
    }
  };
  return (
    <div className="image-upload field" ref={root} data-uploading={busy}>
      <label htmlFor={id}>
        {label}
        {required ? ' (required)' : ''}
      </label>
      {value && failed !== value ? (
        <img
          className="image-upload-preview"
          src={value}
          alt={label + ' preview'}
          onError={() => setFailed(value)}
        />
      ) : (
        <div className="image-upload-empty">
          <ImageIcon size={30} />
          <span>
            {value
              ? 'Image unavailable — upload a replacement'
              : 'Choose an image from your device'}
          </span>
        </div>
      )}
      <input
        ref={input}
        id={id}
        className="image-file-input"
        type="file"
        tabIndex={-1}
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        required={required && !value}
        disabled={busy || disabled}
        onInvalid={(event) => {
          event.preventDefault();
          notify('Please upload ' + label.toLowerCase() + ' before saving.', 'error');
          uploadButton.current?.focus();
        }}
        onChange={(event) => upload(event.target.files?.[0])}
      />
      {name && <input type="hidden" name={name} value={value} />}
      <div className="actions">
        <button
          ref={uploadButton}
          className="button outline small"
          type="button"
          disabled={busy || disabled}
          onClick={() => input.current.click()}
        >
          <Upload size={16} />
          {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        </button>
        {value && !required && (
          <button
            type="button"
            className="text-button danger"
            disabled={busy || disabled}
            onClick={() => {
              onChange('');
              setStatus('Image removed. Save changes to apply.');
            }}
          >
            Remove image
          </button>
        )}
      </div>
      <small>JPG, PNG or WebP · Up to 10 MB</small>
      <small role="status">{status}</small>
    </div>
  );
}
