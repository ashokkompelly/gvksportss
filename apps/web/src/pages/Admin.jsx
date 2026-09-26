import { useState } from 'react';
import AdminModal from '../components/AdminModal';
import TeamManager from '../components/TeamManager';
import { RegistrationDetailsForm } from '../components/EventRegistration';
import AdminPreview from '../components/AdminPreview';
import ImageUpload from '../components/ImageUpload';
import GalleryImagesUpload from '../components/GalleryImagesUpload';
import { galleryImages } from '../../../../shared/gallery';
import { notify } from '../lib/notifications';
import PageContentManager, { PageContentEditor } from '../components/PageContentEditor';
import { managedSlugs } from '../../../../shared/siteContent';
import { Heading, useData, State, Action, Empty } from '../components/ui';
import { api, date, money } from '../lib/api';
const fields = {
  pages: { slug: 'text', title: 'text', body: 'textarea' },
  programs: {
    title: 'text',
    sport: 'sport',
    level: 'text',
    description: 'textarea',
    mode: 'text',
    image: 'text',
  },
  events: {
    title: 'text',
    sport: 'sport',
    description: 'textarea',
    start: 'datetime-local',
    capacity: 'number',
    membersOnly: 'checkbox',
    image: 'text',
    imageAlt: 'text',
  },
  slots: {
    title: 'text',
    sport: 'sport',
    start: 'datetime-local',
    end: 'datetime-local',
    location: 'text',
    capacity: 'number',
    membersOnly: 'checkbox',
  },
  plans: { title: 'text', description: 'textarea', price: 'number', durationDays: 'number' },
  gallery: { title: 'text', description: 'textarea', url: 'text' },
};
const labels = {
  slug: 'URL slug',
  title: 'Title',
  published: 'Published on website',
  body: 'Page content',
  membersOnly: 'Active members only',
  durationDays: 'Duration (days)',
  price: 'Price (INR)',
  url: 'Gallery image',
  image: 'Image',
  imageAlt: 'Image description (optional)',
  start: 'Starts at (your device timezone)',
  end: 'Ends at (your device timezone)',
};
function localDate(s) {
  const d = new Date(s);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function Editor(props) {
  return (
    <AdminModal title={props.item.id ? 'Edit item' : 'Add new item'} onClose={props.onClose}>
      <EditorForm {...props} />
    </AdminModal>
  );
}
function EditorForm({ kind, item, onClose, onSave }) {
  const [image, setImage] = useState(item.image || item.url || '');
  const [images, setImages] = useState(() => galleryImages(item));
  const [busy, setBusy] = useState(false);
  return (
    <form
      data-saving={busy}
      className="card form editor"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget),
          body =
            kind === 'pages'
              ? { config: item.config || {} }
              : kind === 'events'
                ? { location: item.location || '' }
                : {};
        for (const [key, type] of Object.entries({ ...fields[kind], published: 'checkbox' })) {
          const value = fd.get(key);
          body[key] =
            type === 'checkbox'
              ? value === 'on'
              : type === 'number'
                ? Number(value)
                : type === 'datetime-local'
                  ? new Date(value).toISOString()
                  : value;
        }
        if (kind === 'gallery') {
          if (!images.length) {
            notify('Upload at least one event photo before saving.', 'error');
            return;
          }
          body.images = images;
          body.url = images[0];
        }
        setBusy(true);
        try {
          await api('/admin/' + kind + (item.id ? '/' + item.id : ''), {
            method: item.id ? 'PUT' : 'POST',
            body,
          });
          onSave();
        } catch {
          // The API displays a persistent error notification.
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="section-title">
        <h2>
          {item.id ? 'Edit' : 'Create'} {kind === 'slots' ? 'session' : kind.replace(/s$/, '')}
        </h2>
        <button type="button" onClick={onClose} className="text-button">
          Close
        </button>
      </div>
      {Object.entries({ ...fields[kind], published: 'checkbox' }).map(([key, type]) =>
        kind === 'gallery' && key === 'url' ? (
          <GalleryImagesUpload key={key} value={images} onChange={setImages} disabled={busy} />
        ) : key === 'image' ? (
          <ImageUpload
            key={key}
            name={key}
            value={image}
            onChange={setImage}
            label={
              kind === 'events' ? 'Event image' : kind === 'gallery' ? 'Gallery image' : 'Image'
            }
            required={kind === 'events' || kind === 'gallery'}
            disabled={busy}
          />
        ) : (
          <label className={'field ' + (type === 'checkbox' ? 'check' : '')} key={key}>
            <span>
              {kind === 'events' && key === 'image'
                ? 'Event image'
                : labels[key] || key[0].toUpperCase() + key.slice(1)}
            </span>
            {type === 'textarea' ? (
              <textarea name={key} defaultValue={item[key] || ''} required maxLength={5000} />
            ) : type === 'sport' ? (
              <select name={key} defaultValue={item[key] || 'Chess'}>
                <option>Chess</option>
                <option>Badminton</option>
              </select>
            ) : type === 'checkbox' ? (
              <input name={key} type="checkbox" defaultChecked={item[key] || false} />
            ) : (
              <input
                name={key}
                type={type}
                readOnly={
                  kind === 'pages' &&
                  key === 'slug' &&
                  [...managedSlugs, 'footer'].includes(item.slug)
                }
                title={
                  kind === 'pages' &&
                  key === 'slug' &&
                  [...managedSlugs, 'footer'].includes(item.slug)
                    ? 'This reserved URL is used by the main navigation.'
                    : undefined
                }
                required={key !== 'imageAlt' && (key !== 'image' || kind === 'events')}
                maxLength={key === 'image' ? 2000 : key === 'imageAlt' ? 250 : undefined}
                min={type === 'number' ? (key === 'price' ? 0 : 1) : undefined}
                step={key === 'price' ? '0.01' : undefined}
                defaultValue={
                  item[key] !== undefined && item[key] !== ''
                    ? type === 'datetime-local'
                      ? localDate(item[key])
                      : item[key]
                    : ''
                }
              />
            )}
          </label>
        ),
      )}
      <button type="submit" className="button" disabled={busy}>
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
function FooterEditor(props) {
  return (
    <AdminModal title={'Edit footer'} onClose={props.onClose}>
      <FooterEditorForm {...props} />
    </AdminModal>
  );
}
function FooterEditorForm({ item, onClose, onSave }) {
  const [config, setConfig] = useState(() => ({
      ...item.config,
      bottomLinks: (item.config?.bottomLinks || []).filter(
        (link) => !/directions|location|address/i.test(link.label),
      ),
    })),
    [busy, setBusy] = useState(false);
  const setValue = (key, value) => setConfig((current) => ({ ...current, [key]: value }));
  const updateList = (key, index, field, value) =>
    setConfig((current) => ({
      ...current,
      [key]: current[key].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  const updateTextList = (key, index, value) =>
    setConfig((current) => ({
      ...current,
      [key]: current[key].map((entry, entryIndex) => (entryIndex === index ? value : entry)),
    }));
  const removeList = (key, index) =>
    setConfig((current) => ({ ...current, [key]: current[key].filter((_, i) => i !== index) }));
  const addList = (key, entry) =>
    setConfig((current) => ({ ...current, [key]: [...current[key], entry] }));
  const input = (label, key, type = 'text') => (
    <label className="field" key={key}>
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea
          value={config[key] || ''}
          onChange={(e) => setValue(key, e.target.value)}
          rows={3}
        />
      ) : (
        <input value={config[key] || ''} onChange={(e) => setValue(key, e.target.value)} />
      )}
    </label>
  );
  const linkList = (key, title) => (
    <fieldset>
      <legend>{title}</legend>
      {(config[key] || []).map((link, index) => (
        <div className="admin-inline-editor" key={`${key}-${index}`}>
          <label className="field">
            <span>Link label</span>
            <input
              value={link.label}
              onChange={(e) => updateList(key, index, 'label', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Link URL</span>
            <input
              value={link.href}
              onChange={(e) => updateList(key, index, 'href', e.target.value)}
            />
          </label>
          <button
            type="button"
            className="text-button danger"
            onClick={() => removeList(key, index)}
          >
            Remove link
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button outline small"
        onClick={() => addList(key, { label: 'New link', href: '/' })}
      >
        + Add link
      </button>
    </fieldset>
  );
  return (
    <form
      data-saving={busy}
      className="card form editor home-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api('/admin/pages/' + item.id, {
            method: 'PUT',
            body: {
              slug: 'footer',
              title: 'Site Footer',
              body: 'Footer configuration',
              published: true,
              config,
            },
          });
          onSave();
        } catch {
          // The API displays a persistent error notification.
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="section-title">
        <div>
          <span className="eyebrow">SITE FOOTER</span>
          <h2>Footer content</h2>
        </div>
        <button type="button" onClick={onClose} className="text-button">
          Close
        </button>
      </div>
      <p>Edit the footer branding, enquiry contact, navigation links, and bottom links.</p>
      <fieldset>
        <legend>Brand and WhatsApp</legend>
        {input('Brand name', 'brandName')}
        {input('Brand tagline', 'brandTagline')}
        {input('Brand description', 'brandDescription', 'textarea')}
        {input('WhatsApp button label', 'whatsappLabel')}
        {input('WhatsApp number (country code, no +)', 'whatsappNumber')}
        {input('WhatsApp message', 'whatsappMessage', 'textarea')}
      </fieldset>
      <fieldset>
        <legend>Instagram link</legend>
        <label className="field check">
          <input
            type="checkbox"
            checked={config.instagramEnabled ?? true}
            onChange={(e) => setValue('instagramEnabled', e.target.checked)}
          />
          <span>Show Instagram link</span>
        </label>
        {input('Instagram handle (without @)', 'instagramHandle')}
        {input('Instagram link label', 'instagramLabel')}
      </fieldset>
      {linkList('quickLinks', config.quickLinksTitle || 'Academy Links')}
      {input('Academy links heading', 'quickLinksTitle')}
      {linkList('programs', config.programsTitle || 'Programs')}
      {input('Programs heading', 'programsTitle')}
      <fieldset>
        <legend>Contact details</legend>
        {input('Contact heading', 'contactTitle')}
        {input('Contact person label', 'contactName')}
        <label className="field">
          <span>Phone numbers (one per line)</span>
          <textarea
            value={(config.phones || []).join('\n')}
            onChange={(e) => setValue('phones', e.target.value.split('\n').filter(Boolean))}
            rows={3}
          />
        </label>
        <label className="field">
          <span>Email addresses (one per line)</span>
          <textarea
            value={(config.emails || []).join('\n')}
            onChange={(e) => setValue('emails', e.target.value.split('\n').filter(Boolean))}
            rows={3}
          />
        </label>
        <label className="field">
          <span>Hours (one per line)</span>
          <textarea
            value={(config.hours || []).join('\n')}
            onChange={(e) => setValue('hours', e.target.value.split('\n').filter(Boolean))}
            rows={3}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>Footer bottom</legend>
        {input('Copyright text', 'copyright')}
        {linkList('bottomLinks', 'Bottom links')}
      </fieldset>
      <button type="submit" className="button" disabled={busy}>
        {busy ? 'Saving footer…' : 'Save footer'}
      </button>
    </form>
  );
}
function FooterManager() {
  const { data, error, reload } = useData('/admin/pages'),
    [edit, setEdit] = useState(null);
  return (
    <State data={data} error={error}>
      {data?.find((page) => page.slug === 'footer') && (
        <section className="visual-section admin-footer-preview">
          <div className="visual-toolbar">
            <h2>Footer</h2>
            <button
              className="button gold"
              onClick={() => setEdit(data.find((page) => page.slug === 'footer'))}
            >
              Edit footer
            </button>
          </div>
          {(() => {
            const footer = data.find((page) => page.slug === 'footer').config;
            return (
              <div className="footer-top">
                <div className="footer-brand">
                  <img
                    className="brand-logo-img"
                    src={
                      data.find((page) => page.slug === 'header')?.config?.brand?.image ||
                      '/logo.jpeg'
                    }
                    alt=""
                  />
                  <h3>{footer.brandName}</h3>
                  <span className="brand-tagline">{footer.brandTagline}</span>
                  <p>{footer.brandDescription}</p>
                  <span className="footer-instagram-link">@{footer.instagramHandle}</span>
                  <span className="button outline small">{footer.whatsappLabel}</span>
                </div>
                <div className="footer-col">
                  <h4>{footer.quickLinksTitle}</h4>
                  {footer.quickLinks.map((link, index) => (
                    <p key={index}>{link.label}</p>
                  ))}
                </div>
                <div className="footer-col">
                  <h4>{footer.programsTitle}</h4>
                  {footer.programs.map((link, index) => (
                    <p key={index}>{link.label}</p>
                  ))}
                </div>
                <div className="footer-col">
                  <h4>{footer.contactTitle}</h4>
                  {[...footer.phones, ...footer.emails, ...footer.hours].map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            );
          })()}
        </section>
      )}
      {edit && (
        <FooterEditor
          item={edit}
          onClose={() => setEdit(null)}
          onSave={() => {
            setEdit(null);

            reload();
          }}
        />
      )}
    </State>
  );
}
function ContentManager({ kind, initiallyCreate = false }) {
  const { data, error, reload } = useData('/admin/' + kind),
    [edit, setEdit] = useState(initiallyCreate ? {} : null);
  const items =
    kind === 'pages'
      ? data?.filter((item) => ![...managedSlugs, 'footer'].includes(item.slug))
      : data;
  return (
    <>
      <div className="section-title">
        <h2>{kind === 'slots' ? 'Coaching sessions' : kind[0].toUpperCase() + kind.slice(1)}</h2>
        <button className="button" onClick={() => setEdit({})}>
          {kind === 'events'
            ? 'Add new event'
            : kind === 'gallery'
              ? 'Add new gallery item'
              : kind === 'slots'
                ? 'Add new coaching session'
                : 'Add new item'}
        </button>
      </div>
      {kind === 'gallery' && (
        <p>
          Create an album for each event with a title, description and multiple photos. Reorder
          photos to choose the cover. Select Published on website and save to show the album on the
          Gallery page.
        </p>
      )}
      {kind === 'pages' && (
        <p>
          Use the page editors to edit live sections and Team members to manage profiles. Event
          listings are managed separately under Events. Extra pages are accessible at
          /pages/your-slug.
        </p>
      )}
      {edit &&
        (kind === 'pages' && managedSlugs.includes(edit.slug) ? (
          <PageContentEditor
            key={edit.id || edit.slug}
            item={edit}
            onClose={() => setEdit(null)}
            onSave={() => {
              setEdit(null);

              reload();
            }}
          />
        ) : kind === 'pages' && edit.slug === 'footer' ? (
          <FooterEditor
            item={edit}
            onClose={() => setEdit(null)}
            onSave={() => {
              setEdit(null);
              reload();
            }}
          />
        ) : (
          <Editor
            key={edit.id || 'new'}
            kind={kind}
            item={edit}
            onClose={() => setEdit(null)}
            onSave={() => {
              setEdit(null);

              reload();
            }}
          />
        ))}
      <State data={data} error={error}>
        {!items?.length && <Empty>No items yet. Create the first one above.</Empty>}
        <div className="visual-card-grid admin-resource-grid">
          {items?.map((r) => (
            <article className="visual-editable" key={r.id}>
              <div className="visual-toolbar">
                <span className="badge">{r.published ? 'Published' : 'Draft'}</span>
              </div>
              <AdminPreview value={r} kind={kind} />
              <div className="actions visual-item-actions">
                <button className="button outline small" onClick={() => setEdit(r)}>
                  Edit
                </button>
                <Action
                  className="text-button danger"
                  onClick={async () => {
                    if (!window.confirm('Delete this item permanently?')) return;
                    try {
                      await api('/admin/' + kind + '/' + r.id, { method: 'DELETE' });
                      reload();
                    } catch {
                      // The API displays a persistent error notification.
                    }
                  }}
                >
                  Delete
                </Action>
              </div>
            </article>
          ))}
        </div>
      </State>
    </>
  );
}
function UserEditor(props) {
  return (
    <AdminModal title={props.item.id ? 'Edit account' : 'Add account'} onClose={props.onClose}>
      <UserEditorForm {...props} />
    </AdminModal>
  );
}
function UserEditorForm({ item, onClose, onSave }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      data-saving={busy}
      className="card form editor"
      onSubmit={async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(e.currentTarget));
        if (!body.password) delete body.password;
        setBusy(true);
        try {
          await api('/admin/users' + (item.id ? '/' + item.id : ''), {
            method: item.id ? 'PUT' : 'POST',
            body,
          });
          onSave();
        } catch {
          // The API displays a persistent error notification.
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="section-title">
        <div>
          <span className="eyebrow">ACCOUNT ACCESS</span>
          <h2>{item.id ? 'Edit member' : 'Create member'}</h2>
        </div>
        <button type="button" onClick={onClose} className="text-button">
          Close
        </button>
      </div>
      <label className="field">
        <span>Full name</span>
        <input name="name" defaultValue={item.name || ''} required minLength={2} maxLength={120} />
      </label>
      <label className="field">
        <span>Email address</span>
        <input name="email" type="email" defaultValue={item.email || ''} required maxLength={254} />
      </label>
      <label className="field">
        <span>
          {item.id ? 'New password (leave blank to keep current)' : 'Password (12+ characters)'}
        </span>
        <input name="password" type="password" minLength={12} maxLength={128} required={!item.id} />
      </label>
      <label className="field">
        <span>Account role</span>
        <select name="role" defaultValue={item.role || 'member'}>
          <option value="member">Member</option>
          <option value="admin">Administrator</option>
        </select>
      </label>
      <button type="submit" className="button" disabled={busy}>
        {busy ? 'Saving…' : item.id ? 'Save member' : 'Create member'}
      </button>
    </form>
  );
}
function MemberManager() {
  const { data, error, reload } = useData('/admin/users'),
    [edit, setEdit] = useState(null);
  return (
    <>
      <div className="section-title">
        <div>
          <span className="eyebrow">PEOPLE & ACCESS</span>
          <h2>Members and administrators</h2>
        </div>
        <button className="button" onClick={() => setEdit({})}>
          + Add account
        </button>
      </div>
      <p>
        Manage member profiles, administrator access, roles, and password resets from one place.
      </p>
      {edit && (
        <UserEditor
          key={edit.id || 'new'}
          item={edit}
          onClose={() => setEdit(null)}
          onSave={() => {
            setEdit(null);

            reload();
          }}
        />
      )}
      <State data={data} error={error}>
        {!data?.length && <Empty>No accounts yet.</Empty>}
        <div className="admin-list">
          {data?.map((user) => (
            <article className="card list-row" key={user.id}>
              <div>
                <span className="badge">{user.role === 'admin' ? 'Administrator' : 'Member'}</span>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <small>Joined {date(user.created_at)}</small>
              </div>
              <div className="actions">
                <button className="button outline small" onClick={() => setEdit(user)}>
                  Edit
                </button>
                <Action
                  className="text-button danger"
                  onClick={async () => {
                    if (!window.confirm('Delete this account permanently?')) return;
                    try {
                      await api('/admin/users/' + user.id, { method: 'DELETE' });

                      reload();
                    } catch {
                      // The API displays a persistent error notification.
                    }
                  }}
                >
                  Delete
                </Action>
              </div>
            </article>
          ))}
        </div>
      </State>
    </>
  );
}
function Overview() {
  const { data, error, reload } = useData('/admin/overview');
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [registrationSearch, setRegistrationSearch] = useState('');
  return (
    <State data={data} error={error}>
      <h2>Academy overview</h2>
      <div className="grid two">
        {[
          ['Members', data?.users.filter((u) => u.role === 'member').length],
          ['Event registrations', data?.registrations.length],
        ].map(([l, v]) => (
          <div className="card metric" key={l}>
            <span>{l}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      {[
        ['registrations', 'Event registrations'],
        ['users', 'Accounts'],
      ].map(([key, label]) => (
        <div key={key}>
          <h2 className="spaced">{label}</h2>
          {key === 'registrations' && (
            <label className="field">
              <span>Search registrations by event name/ID, name or phone</span>
              <input
                type="search"
                value={registrationSearch}
                onChange={(event) => setRegistrationSearch(event.target.value)}
              />
            </label>
          )}
          {!data?.[key].length && <Empty>No records yet.</Empty>}
          {data?.[key]
            .filter(
              (row) =>
                key !== 'registrations' ||
                [row.name, row.phone, row.item?.title, row.event_id]
                  .join(' ')
                  .toLowerCase()
                  .includes(registrationSearch.toLowerCase()),
            )
            .map((row) => (
              <div className="list-row" key={row.id}>
                <div>
                  <strong>{row.name}</strong>
                  <p>{row.email}</p>
                  {key === 'registrations' && (
                    <p>
                      {row.phone ? (
                        <a href={'tel:' + row.phone}>{row.phone}</a>
                      ) : (
                        'Phone not recorded'
                      )}
                    </p>
                  )}
                </div>
                <div>
                  {row.item ? (
                    <>
                      <strong>{row.item.title}</strong>
                      <p>{date(row.item.start)}</p>
                      {key === 'registrations' && (
                        <>
                          <p>Event ID: {row.event_id}</p>
                          <p>Registered: {date(row.created_at.replace(' ', 'T') + 'Z')}</p>
                        </>
                      )}
                    </>
                  ) : (
                    row.role
                  )}
                </div>
                {key === 'registrations' && (
                  <Action
                    className="text-button danger"
                    onClick={async () => {
                      if (!window.confirm('Cancel this reservation?')) return;
                      try {
                        await api('/admin/' + key + '/' + row.id, { method: 'DELETE' });

                        reload();
                      } catch {
                        // The API displays a persistent error notification.
                      }
                    }}
                  >
                    Cancel
                  </Action>
                )}
                {key === 'registrations' && (
                  <button className="button outline" onClick={() => setEditingRegistration(row)}>
                    Edit details
                  </button>
                )}
              </div>
            ))}
        </div>
      ))}
      {editingRegistration && (
        <AdminModal
          title={'Edit registration: ' + editingRegistration.item.title}
          onClose={() => setEditingRegistration(null)}
        >
          <RegistrationDetailsForm
            initial={editingRegistration}
            submitLabel="Save details"
            onCancel={() => setEditingRegistration(null)}
            onSave={async (details) => {
              await api('/admin/registrations/' + editingRegistration.id, {
                method: 'PATCH',
                body: details,
              });
              setEditingRegistration(null);
              reload();
            }}
          />
        </AdminModal>
      )}
    </State>
  );
}
export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [createKind, setCreateKind] = useState(null);
  const groups = [
    { label: 'Workspace', items: [{ id: 'overview', label: 'Overview' }] },
    {
      label: 'Content',
      items: [
        { id: 'page:header', label: 'Header & navigation' },
        { id: 'page:home', label: 'Home' },
        { id: 'page:about', label: 'About page' },
        { id: 'page:coaching', label: 'Coaching page' },
        { id: 'page:events', label: 'Events page' },
        { id: 'page:contact', label: 'Contact page' },
        { id: 'page:gallery', label: 'Gallery page' },
        { id: 'pages', label: 'Other pages' },
        { id: 'footer', label: 'Footer' },
        { id: 'gallery', label: 'Gallery' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'events', label: 'Events' },
        { id: 'slots', label: 'Coaching sessions' },
        { id: 'plans', label: 'Membership plans' },
      ],
    },
    {
      label: 'People',
      items: [
        { id: 'team', label: 'Team members' },
        { id: 'members', label: 'Members & access' },
      ],
    },
  ];
  return (
    <section className="section">
      <Heading eyebrow="GVK ADMINISTRATION" title="Manage your website." />
      <div className="admin-shell">
        <nav aria-label="Admin sections" className="admin-nav">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <span className="admin-nav-label">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={tab === item.id ? 'selected' : ''}
                  onClick={() => {
                    setCreateKind(null);
                    setTab(item.id);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-main">
          {tab.startsWith('page:') ? (
            <PageContentManager
              key={tab}
              slug={tab.slice(5)}
              onAddEvent={() => {
                setCreateKind('events');
                setTab('events');
              }}
            />
          ) : tab === 'overview' ? (
            <Overview />
          ) : tab === 'members' ? (
            <MemberManager />
          ) : tab === 'team' ? (
            <TeamManager />
          ) : tab === 'footer' ? (
            <FooterManager />
          ) : (
            <ContentManager key={tab} kind={tab} initiallyCreate={createKind === tab} />
          )}
        </div>
      </div>
    </section>
  );
}
