import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { galleryImages } from '../../../../shared/gallery';

export default function GalleryCard({ item, className = '', expanded = false, initialIndex = 0 }) {
  const images = galleryImages(item);
  const [index, setIndex] = useState(initialIndex);
  const [open, setOpen] = useState(false);
  const touch = useRef(null);
  const current = Math.min(index, Math.max(0, images.length - 1));
  const slide = (offset) => setIndex((current + offset + images.length) % images.length);
  return (
    <figure className={`gallery-card ${className}`}>
      {images.length > 0 && (
        <div
          className="gallery-slider"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${item.title} photos`}
          onTouchStart={(event) => {
            const point = event.touches[0];
            touch.current = { x: point.clientX, y: point.clientY };
          }}
          onTouchEnd={(event) => {
            const point = event.changedTouches[0];
            if (touch.current && images.length > 1) {
              const dx = point.clientX - touch.current.x;
              const dy = point.clientY - touch.current.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) slide(dx < 0 ? 1 : -1);
            }
            touch.current = null;
          }}
          onTouchCancel={() => {
            touch.current = null;
          }}
          onKeyDown={(event) => {
            if (images.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
            event.preventDefault();
            slide(event.key === 'ArrowRight' ? 1 : -1);
          }}
        >
          {expanded ? (
            <img src={images[current]} alt={`${item.title} — photo ${current + 1}`} />
          ) : (
            <button
              type="button"
              className="gallery-open"
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
              aria-label={`View ${item.title} event details and photos`}
            >
              <img
                src={images[current]}
                alt={`${item.title} — photo ${current + 1}`}
                loading="lazy"
              />
            </button>
          )}
          {images.length > 1 && (
            <div className="gallery-slide-controls">
              <button
                type="button"
                onClick={() => slide(-1)}
                aria-label={`Previous photo of ${item.title}`}
              >
                <ChevronLeft size={20} />
              </button>
              <span aria-live="polite" aria-atomic="true">
                {current + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={() => slide(1)}
                aria-label={`Next photo of ${item.title}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          {expanded && images.length > 1 && (
            <div className="gallery-thumbnails" aria-label="Event photo library">
              {images.map((url, photoIndex) => (
                <button
                  key={`${url}-${photoIndex}`}
                  type="button"
                  aria-label={`Show photo ${photoIndex + 1}`}
                  aria-pressed={current === photoIndex}
                  onClick={() => setIndex(photoIndex)}
                >
                  <img src={url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <figcaption>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        {!expanded && (
          <button
            type="button"
            className="text-button"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            View event & photos
          </button>
        )}
      </figcaption>
      {open && (
        <GalleryAlbumModal item={item} initialIndex={current} onClose={() => setOpen(false)} />
      )}
    </figure>
  );
}

function GalleryAlbumModal({ item, initialIndex, onClose }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const opener = document.activeElement;
    const node = dialog.current;
    node.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      className="gallery-album-modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className="gallery-album-heading">
        <h2 id={titleId}>{item.title}</h2>
        <button
          type="button"
          className="text-button"
          aria-label="Close event gallery"
          autoFocus
          onClick={onClose}
        >
          <X size={24} />
        </button>
      </div>
      <GalleryCard item={item} expanded initialIndex={initialIndex} />
    </dialog>,
    document.body,
  );
}
