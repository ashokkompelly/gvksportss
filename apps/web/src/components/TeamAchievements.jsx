import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Award, ArrowUpRight, X } from 'lucide-react';

export default function TeamAchievements({ member, buttonLabel, eyebrow }) {
  const id = useId();
  const dialog = useRef(null);
  const profile = member;
  return (
    <div className="coach-achievements">
      <button
        type="button"
        className="button outline achievement-toggle"
        aria-label={`${buttonLabel} for ${profile.name}`}
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={() => {
          dialog.current.showModal();
        }}
      >
        <Award size={18} /> {buttonLabel} <ArrowUpRight size={17} />
      </button>
      {createPortal(
        <dialog
          ref={dialog}
          id={id}
          className="achievement-panel achievement-modal"
          aria-labelledby={`${id}-title`}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              dialog.current.close();
          }}
        >
          <button
            type="button"
            className="achievement-modal-close"
            aria-label="Close achievements"
            autoFocus
            onClick={() => dialog.current.close()}
          >
            <X size={22} />
          </button>
          <span className="eyebrow">{eyebrow}</span>
          <h2 id={`${id}-title`}>{profile.name}</h2>
          <p className="achievement-role">{profile.role}</p>
          <div className="achievement-credential">
            <Award size={20} />
            <strong>{profile.certification}</strong>
          </div>
          <ul>
            {profile.achievements.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <p>{profile.eventValue}</p>
          <Link
            className="light-link"
            onClick={() => dialog.current.close()}
            to={profile.action.href}
          >
            {profile.action.label} <ArrowUpRight size={17} />
          </Link>
        </dialog>,
        document.body,
      )}
    </div>
  );
}
