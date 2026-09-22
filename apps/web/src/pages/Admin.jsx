import { useState } from 'react';
import { Heading, useData, State, Notice, Action, Empty } from '../components/ui';
import { api, date, money } from '../lib/api';
const fields = {
  pages: { slug: 'text', title: 'text', body: 'textarea' },
  programs: { title: 'text', sport: 'sport', level: 'text', description: 'textarea', mode: 'text' },
  events: {
    title: 'text',
    sport: 'sport',
    description: 'textarea',
    start: 'datetime-local',
    location: 'text',
    capacity: 'number',
    membersOnly: 'checkbox',
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
  body: 'Page content',
  membersOnly: 'Active members only',
  durationDays: 'Duration (days)',
  price: 'Price (INR)',
  url: 'Image URL (HTTPS or /local-path)',
  start: 'Starts at (your device timezone)',
  end: 'Ends at (your device timezone)',
};
function localDate(s) {
  const d = new Date(s);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function Editor({ kind, item, onClose, onSave }) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="card form editor"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget),
          body = {};
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
        setBusy(true);
        try {
          await api('/admin/' + kind + (item.id ? '/' + item.id : ''), {
            method: item.id ? 'PUT' : 'POST',
            body,
          });
          onSave();
        } catch (e) {
          setMessage(e.message);
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
      {Object.entries({ ...fields[kind], published: 'checkbox' }).map(([key, type]) => (
        <label className={'field ' + (type === 'checkbox' ? 'check' : '')} key={key}>
          <span>{labels[key] || key[0].toUpperCase() + key.slice(1)}</span>
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
              required
              min={type === 'number' ? (key === 'price' ? 0 : 1) : undefined}
              step={key === 'price' ? '0.01' : undefined}
              defaultValue={
                item[key] ? (type === 'datetime-local' ? localDate(item[key]) : item[key]) : ''
              }
            />
          )}
        </label>
      ))}
      <Notice message={message} />
      <button className="button" disabled={busy}>
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
function ContentManager({ kind }) {
  const { data, error, reload } = useData('/admin/' + kind),
    [edit, setEdit] = useState(null),
    [message, setMessage] = useState('');
  return (
    <>
      <div className="section-title">
        <h2>{kind === 'slots' ? 'Coaching sessions' : kind[0].toUpperCase() + kind.slice(1)}</h2>
        <button className="button" onClick={() => setEdit({})}>
          + Create
        </button>
      </div>
      {kind === 'gallery' && (
        <p>
          Add image URLs from your image host. Direct file uploads can be added in the next phase.
        </p>
      )}
      {kind === 'pages' && (
        <p>
          Home and About use their matching slugs. Extra pages are accessible at /pages/your-slug.
        </p>
      )}
      <Notice message={message} />
      {edit && (
        <Editor
          key={edit.id || 'new'}
          kind={kind}
          item={edit}
          onClose={() => setEdit(null)}
          onSave={() => {
            setEdit(null);
            setMessage('Saved successfully.');
            reload();
          }}
        />
      )}
      <State data={data} error={error}>
        {!data?.length && <Empty>No items yet. Create the first one above.</Empty>}
        <div className="admin-list">
          {data?.map((r) => (
            <article className="card list-row" key={r.id}>
              <div>
                <span className="badge">{r.published ? 'Published' : 'Draft'}</span>
                <h3>{r.title}</h3>
                <p>{r.start ? date(r.start) : r.slug || r.description?.slice(0, 100)}</p>
              </div>
              <div className="actions">
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
                    } catch (e) {
                      setMessage(e.message);
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
  const { data, error, reload } = useData('/admin/overview'),
    [message, setMessage] = useState('');
  return (
    <State data={data} error={error}>
      <h2>Academy overview</h2>
      <div className="grid three">
        {[
          ['Members', data?.users.filter((u) => u.role === 'member').length],
          ['Coaching bookings', data?.bookings.length],
          ['Event registrations', data?.registrations.length],
        ].map(([l, v]) => (
          <div className="card metric" key={l}>
            <span>{l}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <Notice message={message} />
      <h2 className="spaced">Membership requests</h2>
      <p>Activate only after your team confirms the agreed fee and membership terms.</p>
      {!data?.memberships.length && <Empty>No membership requests yet.</Empty>}
      {data?.memberships.map((m) => (
        <article className="card list-row" key={m.id}>
          <div>
            <strong>
              {m.name} · {m.plan}
            </strong>
            <p>
              {m.email} · {m.status}
              {m.valid_until ? ' · Until ' + date(m.valid_until) : ''}
            </p>
          </div>
          <div className="actions">
            {(m.status === 'pending'
              ? ['active', 'cancelled']
              : m.status === 'active'
                ? ['cancelled']
                : []
            ).map((status) => (
              <Action
                key={status}
                className="button outline small"
                onClick={async () => {
                  if (
                    !window.confirm(
                      status === 'active' ? 'Activate this membership?' : 'Cancel this membership?',
                    )
                  )
                    return;
                  try {
                    await api('/admin/memberships/' + m.id, { method: 'PATCH', body: { status } });
                    reload();
                  } catch (e) {
                    setMessage(e.message);
                  }
                }}
              >
                {status === 'active' ? 'Activate' : 'Cancel'}
              </Action>
            ))}
          </div>
        </article>
      ))}
      <h2 className="spaced">Enquiries</h2>
      {!data?.enquiries.length && <Empty>No enquiries yet.</Empty>}
      {data?.enquiries.map((e) => (
        <article className="card" key={e.id}>
          <h3>
            {e.name} {e.organization && '· ' + e.organization}
          </h3>
          <p>{e.email}</p>
          <p className="prose">{e.message}</p>
        </article>
      ))}
      {[
        ['bookings', 'Coaching bookings'],
        ['registrations', 'Event registrations'],
        ['users', 'Accounts'],
      ].map(([key, label]) => (
        <div key={key}>
          <h2 className="spaced">{label}</h2>
          {!data?.[key].length && <Empty>No records yet.</Empty>}
          {data?.[key].map((row) => (
            <div className="list-row" key={row.id}>
              <div>
                <strong>{row.name}</strong>
                <p>{row.email}</p>
              </div>
              <div>
                {row.item ? (
                  <>
                    <strong>{row.item.title}</strong>
                    <p>{date(row.item.start)}</p>
                  </>
                ) : (
                  row.role
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </State>
  );
}
export default function Admin() {
  const [tab, setTab] = useState('overview');
  return (
    <section className="section">
      <Heading eyebrow="GVK ADMINISTRATION" title="Manage your academy." />
      <div className="admin-shell">
        <nav aria-label="Admin sections" className="admin-nav">
          {['overview', ...Object.keys(fields)].map((t) => (
            <button key={t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}>
              {t === 'slots' ? 'Sessions' : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <div className="admin-main">
          {tab === 'overview' ? <Overview /> : <ContentManager key={tab} kind={tab} />}
        </div>
      </div>
    </section>
  );
}
