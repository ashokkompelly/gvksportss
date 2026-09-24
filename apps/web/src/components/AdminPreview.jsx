import {
  Award,
  ArrowUpRight,
  Image as ImageIcon,
  Trophy,
  School,
  Building2,
  Users,
} from 'lucide-react';
import { DisciplineShowcase } from '../pages/Coaching';

export default function AdminPreview({ value = {}, kind = '' }) {
  const data = value;
  if (kind === 'header')
    return (
      <div className="admin-header-preview">
        <div className="brand">
          {data.brand.showLogo && data.brand.image && (
            <img className="brand-logo-img" src={data.brand.image} alt={data.brand.alt || ''} />
          )}
          <div className="brand-text">
            {data.brand.showName && <strong>{data.brand.name}</strong>}
            {data.brand.showTagline && <small>{data.brand.tagline}</small>}
          </div>
        </div>
        <div className="admin-menu-preview">
          {data.navigation.enabled &&
            data.navigation.items
              .filter((item) => item.published && item.desktop)
              .map((item) => <span key={item.id}>{item.label}</span>)}
        </div>
        {data.account.desktopEnabled && (
          <span className="button gold small">{data.account.guestAction.label}</span>
        )}
      </div>
    );
  if (kind === 'coaching')
    return (
      <div className="admin-preview-surface" inert>
        <DisciplineShowcase showcase={data} primary />
      </div>
    );
  if (kind === 'team')
    return (
      <article className="coach-card admin-preview-surface">
        {data.image && (
          <img className="coach-photo" src={data.image} alt={data.imageAlt || ''} loading="lazy" />
        )}
        <span className="coach-exp-badge">
          <Award size={13} />
          {data.experience}
        </span>
        <h3>{data.name || 'New team member'}</h3>
        <span className="eyebrow">{data.role}</span>
        <div className="coach-domain-tag">{data.domain}</div>
        <p>{data.bio}</p>
        <small>{data.certification}</small>
        <span className="button outline small">{data.achievements?.length || 0} achievements</span>
      </article>
    );
  if (kind === 'gallery')
    return (
      <figure className="admin-gallery-preview">
        {data.url ? <img src={data.url} alt={data.title || ''} loading="lazy" /> : <ImageIcon />}
        <figcaption>
          <h3>{data.title}</h3>
          <p>{data.description}</p>
        </figcaption>
      </figure>
    );
  if (kind === 'slide')
    return (
      <div className="admin-slide-preview">
        {data.image && (
          <img
            src={data.image}
            alt={data.imageAlt || ''}
            style={{ objectFit: data.containImage ? 'contain' : 'cover' }}
            loading="lazy"
          />
        )}
        <div>
          <span className="eyebrow">{data.eyebrow}</span>
          <h3>{data.title}</h3>
          <p>{data.description}</p>
          <small>{data.caption}</small>
        </div>
      </div>
    );
  const image = data.image;
  const Icon = { school: School, building: Building2, users: Users }[data.icon] || Trophy;
  const actions = Object.entries(data).filter(
    ([, entry]) => entry && typeof entry === 'object' && !Array.isArray(entry) && entry.label,
  );
  return (
    <div
      className={
        'admin-component-copy ' +
        ({
          events: 'card event-card',
          step: 'event-step',
          service: 'service-discipline',
          audience: 'event-service-card',
        }[kind] || '')
      }
    >
      {kind === 'audience' && (
        <div className="service-card-top">
          <Icon size={30} />
        </div>
      )}
      {kind === 'events' && !image && <p className="badge">Event image needed</p>}
      {image && (
        <img
          className="admin-preview-image"
          src={image}
          alt={data.imageAlt || data.alt || ''}
          loading="lazy"
        />
      )}
      {(data.eyebrow || data.sport || data.tagline) && (
        <span className="eyebrow">{data.eyebrow || data.sport || data.tagline}</span>
      )}
      <h3>{data.title || data.name || data.label || data.brandName || data.emptyTitle}</h3>
      {(data.description || data.body || data.brandDescription) && (
        <p>{data.description || data.body || data.brandDescription}</p>
      )}
      {data.trainerTitle && <h3>{data.trainerTitle}</h3>}
      {data.paragraphs?.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {data.start && (
        <p>
          {new Date(data.start).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      )}
      {data.capacity != null && <span className="badge">{data.capacity} places</span>}
      {data.price != null && (
        <p>
          ₹{data.price} / {data.durationDays} days
        </p>
      )}
      {data.href && <small className="muted">{data.href}</small>}
      {actions.length > 0 && (
        <div className="actions">
          {actions.map(([key, action]) => (
            <span className="button outline small" key={key}>
              {action.label}
              <ArrowUpRight size={14} />
            </span>
          ))}
        </div>
      )}
      {Object.entries(data)
        .filter(([key, entry]) => typeof entry === 'string' && /Label$|^captionLabel$/.test(key))
        .map(([key, entry]) => (
          <span className="badge" key={key}>
            {entry}
          </span>
        ))}
      {data.items?.some((item) => typeof item === 'object') && (
        <ul className="admin-service-preview">
          {data.items.map((item, index) => (
            <li key={item.id || index}>
              {item.label}
              <ArrowUpRight size={14} />
            </li>
          ))}
        </ul>
      )}
      {Object.entries(data)
        .filter(
          ([key, entry]) =>
            Array.isArray(entry) && typeof entry[0] === 'string' && key !== 'paragraphs',
        )
        .map(([key, entries]) => (
          <ul key={key}>
            {entries.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
        ))}
    </div>
  );
}
