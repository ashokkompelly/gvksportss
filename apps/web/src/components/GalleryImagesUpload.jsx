import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { notify } from '../lib/notifications';
import { MAX_GALLERY_IMAGES } from '../../../../shared/gallery';

export default function GalleryImagesUpload({ value, onChange, disabled }) {
  const root = useRef(null);
  const pending = useRef(false);
  const controller = useRef(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => {
    const form = root.current.closest('form');
    const blockSave = (event) => {
      if (!pending.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      notify('Please wait for all photos to finish uploading before saving.', 'error');
    };
    form?.addEventListener('submit', blockSave, true);
    return () => {
      form?.removeEventListener('submit', blockSave, true);
      controller.current?.abort();
    };
  }, []);
  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (value.length + files.length > MAX_GALLERY_IMAGES) {
      notify(`Choose up to ${MAX_GALLERY_IMAGES} photos per event.`, 'error');
      return;
    }
    if (
      files.some(
        (file) =>
          !/\.(jpe?g|png|webp)$/i.test(file.name) || !file.size || file.size > 10 * 1024 * 1024,
      )
    ) {
      notify('Choose JPG, PNG or WebP photos, up to 10 MB each.', 'error');
      return;
    }
    const active = new AbortController();
    controller.current = active;
    pending.current = true;
    setBusy(true);
    const next = [...value];
    let failed = 0;
    for (const [index, file] of files.entries()) {
      setStatus(`Uploading photo ${index + 1} of ${files.length}…`);
      try {
        const result = await api('/admin/uploads', {
          method: 'POST',
          body: file,
          signal: active.signal,
        });
        if (active.signal.aborted) return;
        next.push(result.url);
        onChange([...next]);
      } catch {
        if (active.signal.aborted) return;
        failed++;
      }
    }
    pending.current = false;
    setBusy(false);
    setStatus(
      `${files.length - failed} photos uploaded.${failed ? ` ${failed} failed; select those files again to retry.` : ''} Save changes to publish.`,
    );
  };
  const move = (index, offset) => {
    const next = [...value];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };
  return (
    <div className="field gallery-images-upload" ref={root} data-uploading={busy}>
      <label>
        Event photos (required)
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          disabled={disabled || busy}
          onChange={upload}
        />
      </label>
      <small>
        Select multiple photos at once. Up to {MAX_GALLERY_IMAGES} photos, 10 MB each. The first
        photo is the cover.
      </small>
      <div className="gallery-upload-list">
        {value.map((url, index) => (
          <div className="gallery-upload-item" key={`${url}-${index}`}>
            <img src={url} alt={`Event photo ${index + 1}`} />
            <span>{index === 0 ? 'Cover photo' : `Photo ${index + 1}`}</span>
            <div className="actions">
              <button
                type="button"
                className="text-button"
                disabled={disabled || busy || index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Move photo ${index + 1} earlier`}
              >
                Earlier
              </button>
              <button
                type="button"
                className="text-button"
                disabled={disabled || busy || index === value.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Move photo ${index + 1} later`}
              >
                Later
              </button>
              <button
                type="button"
                className="text-button danger"
                disabled={disabled || busy}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Remove photo ${index + 1}`}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <small role="status">{status}</small>
    </div>
  );
}
