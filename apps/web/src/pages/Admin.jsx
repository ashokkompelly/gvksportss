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
  slug: 'URL slug',
  title: 'Page title',
  body: 'Page content',
  membersOnly: 'Active members only',
  durationDays: 'Duration (days)',
  price: 'Price (INR)',
  url: 'Image URL (HTTPS or /local-path)',
  start: 'Starts at (your device timezone)',
  end: 'Ends at (your device timezone)',
};
const homeConfigTemplate = {
  eyebrow: 'CHESS + BADMINTON • HYDERABAD',
  heroDescription: 'Elevate your game with world-class coaching, Olympic-grade badminton courts, and interactive chess coaching powered by the Chesslang platform.',
  primaryAction: { label: 'Explore Coaching Batches', href: '/coaching' },
  secondaryAction: { label: 'Tournaments & Events', href: '/events' },
  heroImage: '/logo.png',
  heroImageAlt: 'GVK Sportss Gold and Black Emblem',
  heroLabel: 'THE GVK STANDARD',
  heroStandard: 'Discipline. Technique. Mastery.',
  metrics: [
    { value: '8 Courts', label: 'Olympic-Grade BWF Mats' },
    { value: 'Chesslang', label: 'Platform Coaching' },
    { value: '15+ Coaches', label: 'BWF & FIDE Certified Mentors' },
    { value: '500+', label: 'Active Academy Athletes' },
  ],
  heroFoot: ['01 / 8 BWF Synthetic Courts', '02 / Chesslang Platform Coaching', '03 / FIDE & BWF Certified Coaches'],
  sportsEyebrow: 'CHOOSE YOUR DISCIPLINE',
  sportsTitle: 'Precision on court.\nStrategy on board.',
  sportsDescription: 'Whether smashing at 350+ km/h or outmaneuvering an opponent in a Sicilian defense, GVK provides championship-level mentoring.',
  sports: [
    { number: '01 / BADMINTON HIGH-PERFORMANCE', title: 'Badminton Academy', description: 'BWF Level 2 certified coaching, slow-motion biomechanics video smash analysis, radar speed tracking, and Olympic-spec synthetic shock-absorbing courts.', badges: ['BWF Certified', 'Video Analysis', 'Smash Radar'], href: '/coaching?sport=Badminton' },
    { number: '02 / CHESS COACHING', title: 'Chess Masterclass', description: 'Integrated with the Chesslang platform for digital coaching. FIDE-rated trainers, interactive live board sessions, tactical puzzle homework, and regular game debriefs.', badges: ['Chesslang Platform Coaching', 'FIDE Mentors', 'Interactive Boards'], href: '/coaching?sport=Chess' },
  ],
  communityEyebrow: 'SPORTS FOR EVERY COMMUNITY',
  communityTitle: 'Bring championship energy into play.',
  communityAction: { label: 'Plan an Experience', href: '/contact' },
  communities: [
    { icon: 'school', title: 'Schools & Academies', description: 'Curriculum-integrated badminton and chess coaching, inter-school tournaments, and youth scout camps.' },
    { icon: 'users', title: 'Gated Communities', description: 'Resident leagues, weekend clinics, certified coaches on-site, and friendly multi-age championships.' },
    { icon: 'building', title: 'Corporate Leagues', description: 'Executive stress-relief wellness, corporate badminton cups, and workplace chess tournaments.' },
  ],
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
              readOnly={kind === 'pages' && key === 'slug' && ['home', 'about'].includes(item.slug)}
              title={
                kind === 'pages' && key === 'slug' && ['home', 'about'].includes(item.slug)
                  ? 'This reserved URL is used by the main navigation.'
                  : undefined
              }
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
function HomeEditor({ item, onClose, onSave }) {
  const [config, setConfig] = useState(() => ({
      ...homeConfigTemplate,
      ...(item.config || {}),
      primaryAction: { ...homeConfigTemplate.primaryAction, ...(item.config?.primaryAction || {}) },
      secondaryAction: { ...homeConfigTemplate.secondaryAction, ...(item.config?.secondaryAction || {}) },
      communityAction: { ...homeConfigTemplate.communityAction, ...(item.config?.communityAction || {}) },
      metrics: item.config?.metrics || homeConfigTemplate.metrics,
      sports: item.config?.sports || homeConfigTemplate.sports,
      communities: item.config?.communities || homeConfigTemplate.communities,
      heroFoot: item.config?.heroFoot || homeConfigTemplate.heroFoot,
    })),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const setValue = (key, value) => setConfig((current) => ({ ...current, [key]: value }));
  const setNested = (key, field, value) =>
    setConfig((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));
  const updateList = (key, index, field, value) =>
    setConfig((current) => ({
      ...current,
      [key]: current[key].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  const removeList = (key, index) =>
    setConfig((current) => ({ ...current, [key]: current[key].filter((_, i) => i !== index) }));
  const addList = (key, entry) => setConfig((current) => ({ ...current, [key]: [...current[key], entry] }));
  const control = (label, value, onChange, type = 'text') => (
    <label className="field" key={label}>
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
  return (
    <form
      className="card form editor home-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        try {
          await api('/admin/pages/' + item.id, {
            method: 'PUT',
            body: {
              slug: item.slug,
              title: form.get('title'),
              body: form.get('body'),
              published: form.get('published') === 'on',
              config,
            },
          });
          onSave();
        } catch (error) {
          setMessage(error.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="section-title">
        <div><span className="eyebrow">HOMEPAGE BUILDER</span><h2>Edit Home page</h2></div>
        <button type="button" onClick={onClose} className="text-button">Close</button>
      </div>
      <label className="field"><span>Page title</span><input name="title" defaultValue={item.title} required /></label>
      <label className="field"><span>Page description</span><textarea name="body" defaultValue={item.body} required rows={3} /></label>
      <label className="field check"><span>Published</span><input name="published" type="checkbox" defaultChecked={item.published} /></label>

      <fieldset><legend>Hero section</legend>
        {control('Eyebrow', config.eyebrow, (v) => setValue('eyebrow', v))}
        {control('Hero description', config.heroDescription, (v) => setValue('heroDescription', v), 'textarea')}
        {control('Hero image path or HTTPS URL', config.heroImage, (v) => setValue('heroImage', v))}
        {control('Image alt text', config.heroImageAlt, (v) => setValue('heroImageAlt', v))}
        {control('Hero label', config.heroLabel, (v) => setValue('heroLabel', v))}
        {control('Hero standard line', config.heroStandard, (v) => setValue('heroStandard', v))}
        {control('Primary button label', config.primaryAction.label, (v) => setNested('primaryAction', 'label', v))}
        {control('Primary button link', config.primaryAction.href, (v) => setNested('primaryAction', 'href', v))}
        {control('Secondary button label', config.secondaryAction.label, (v) => setNested('secondaryAction', 'label', v))}
        {control('Secondary button link', config.secondaryAction.href, (v) => setNested('secondaryAction', 'href', v))}
      </fieldset>

      <fieldset><legend>Hero highlights and metrics</legend>
        {config.heroFoot.map((value, index) =>
          control(`Hero highlight ${index + 1}`, value, (v) =>
            setConfig((current) => ({
              ...current,
              heroFoot: current.heroFoot.map((entry, entryIndex) =>
                entryIndex === index ? v : entry,
              ),
            })),
          ),
        )}
        {config.metrics.map((metric, index) => <div className="admin-inline-editor" key={`metric-${index}`}>
          {control('Number or value', metric.value, (v) => updateList('metrics', index, 'value', v))}
          {control('Label', metric.label, (v) => updateList('metrics', index, 'label', v))}
          <button type="button" className="text-button danger" onClick={() => removeList('metrics', index)}>Remove metric</button>
        </div>)}
        <button type="button" className="button outline small" onClick={() => addList('metrics', { value: 'New', label: 'New metric' })}>+ Add metric</button>
      </fieldset>

      <fieldset><legend>Sports cards</legend>
        {control('Section eyebrow', config.sportsEyebrow, (v) => setValue('sportsEyebrow', v))}
        {control('Section title', config.sportsTitle, (v) => setValue('sportsTitle', v), 'textarea')}
        {control('Section description', config.sportsDescription, (v) => setValue('sportsDescription', v), 'textarea')}
        {config.sports.map((sport, index) => <div className="admin-inline-editor" key={`sport-${index}`}>
          {control('Card number', sport.number, (v) => updateList('sports', index, 'number', v))}
          {control('Card title', sport.title, (v) => updateList('sports', index, 'title', v))}
          {control('Card description', sport.description, (v) => updateList('sports', index, 'description', v), 'textarea')}
          {control('Badges (comma separated)', sport.badges.join(', '), (v) => updateList('sports', index, 'badges', v.split(',').map((badge) => badge.trim()).filter(Boolean)))}
          {control('Card link', sport.href, (v) => updateList('sports', index, 'href', v))}
          <button type="button" className="text-button danger" onClick={() => removeList('sports', index)}>Remove card</button>
        </div>)}
        <button type="button" className="button outline small" onClick={() => addList('sports', { number: '03 / NEW', title: 'New sport', description: 'Describe this offering.', badges: [], href: '/coaching' })}>+ Add sports card</button>
      </fieldset>

      <fieldset><legend>Community section</legend>
        {control('Section eyebrow', config.communityEyebrow, (v) => setValue('communityEyebrow', v))}
        {control('Section title', config.communityTitle, (v) => setValue('communityTitle', v))}
        {control('Button label', config.communityAction.label, (v) => setNested('communityAction', 'label', v))}
        {control('Button link', config.communityAction.href, (v) => setNested('communityAction', 'href', v))}
        {config.communities.map((community, index) => <div className="admin-inline-editor" key={`community-${index}`}>
          {control('Icon (school, users, or building)', community.icon, (v) => updateList('communities', index, 'icon', v))}
          {control('Card title', community.title, (v) => updateList('communities', index, 'title', v))}
          {control('Card description', community.description, (v) => updateList('communities', index, 'description', v), 'textarea')}
          <button type="button" className="text-button danger" onClick={() => removeList('communities', index)}>Remove card</button>
        </div>)}
        <button type="button" className="button outline small" onClick={() => addList('communities', { icon: 'users', title: 'New community', description: 'Describe this community offering.' })}>+ Add community card</button>
      </fieldset>
      <Notice message={message} />
      <button className="button" disabled={busy}>{busy ? 'Saving homepage…' : 'Save homepage'}</button>
    </form>
  );
}
function FooterEditor({ item, onClose, onSave }) {
  const [config, setConfig] = useState(item.config || {}),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const setValue = (key, value) => setConfig((current) => ({ ...current, [key]: value }));
  const updateList = (key, index, field, value) => setConfig((current) => ({
    ...current,
    [key]: current[key].map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry),
  }));
  const updateTextList = (key, index, value) => setConfig((current) => ({
    ...current,
    [key]: current[key].map((entry, entryIndex) => entryIndex === index ? value : entry),
  }));
  const removeList = (key, index) => setConfig((current) => ({ ...current, [key]: current[key].filter((_, i) => i !== index) }));
  const addList = (key, entry) => setConfig((current) => ({ ...current, [key]: [...current[key], entry] }));
  const input = (label, key, type = 'text') => (
    <label className="field" key={key}>
      <span>{label}</span>
      {type === 'textarea' ? <textarea value={config[key] || ''} onChange={(e) => setValue(key, e.target.value)} rows={3} /> : <input value={config[key] || ''} onChange={(e) => setValue(key, e.target.value)} />}
    </label>
  );
  const linkList = (key, title) => (
    <fieldset><legend>{title}</legend>
      {(config[key] || []).map((link, index) => <div className="admin-inline-editor" key={`${key}-${index}`}>
        <label className="field"><span>Link label</span><input value={link.label} onChange={(e) => updateList(key, index, 'label', e.target.value)} /></label>
        <label className="field"><span>Link URL</span><input value={link.href} onChange={(e) => updateList(key, index, 'href', e.target.value)} /></label>
        <button type="button" className="text-button danger" onClick={() => removeList(key, index)}>Remove link</button>
      </div>)}
      <button type="button" className="button outline small" onClick={() => addList(key, { label: 'New link', href: '/' })}>+ Add link</button>
    </fieldset>
  );
  return (
    <form className="card form editor home-editor" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      try {
        await api('/admin/pages/' + item.id, { method: 'PUT', body: { slug: 'footer', title: 'Site Footer', body: 'Footer configuration', published: true, config } });
        onSave();
      } catch (error) { setMessage(error.message); } finally { setBusy(false); }
    }}>
      <div className="section-title"><div><span className="eyebrow">SITE FOOTER</span><h2>Footer content</h2></div><button type="button" onClick={onClose} className="text-button">Close</button></div>
      <p>Edit the footer branding, enquiry contact, navigation links, venue details, and bottom links.</p>
      <fieldset><legend>Brand and WhatsApp</legend>
        {input('Brand name', 'brandName')}
        {input('Brand tagline', 'brandTagline')}
        {input('Brand description', 'brandDescription', 'textarea')}
        {input('WhatsApp button label', 'whatsappLabel')}
        {input('WhatsApp number (country code, no +)', 'whatsappNumber')}
        {input('WhatsApp message', 'whatsappMessage', 'textarea')}
      </fieldset>
      {linkList('quickLinks', config.quickLinksTitle || 'Academy Links')}
      {input('Academy links heading', 'quickLinksTitle')}
      {linkList('programs', config.programsTitle || 'Programs')}
      {input('Programs heading', 'programsTitle')}
      <fieldset><legend>Contact and venue</legend>
        {input('Contact heading', 'contactTitle')}
        {input('Contact person label', 'contactName')}
        <label className="field"><span>Phone numbers (one per line)</span><textarea value={(config.phones || []).join('\n')} onChange={(e) => setValue('phones', e.target.value.split('\n').filter(Boolean))} rows={3} /></label>
        <label className="field"><span>Email addresses (one per line)</span><textarea value={(config.emails || []).join('\n')} onChange={(e) => setValue('emails', e.target.value.split('\n').filter(Boolean))} rows={3} /></label>
        <label className="field"><span>Address lines (one per line)</span><textarea value={(config.address || []).join('\n')} onChange={(e) => setValue('address', e.target.value.split('\n').filter(Boolean))} rows={4} /></label>
        <label className="field"><span>Hours (one per line)</span><textarea value={(config.hours || []).join('\n')} onChange={(e) => setValue('hours', e.target.value.split('\n').filter(Boolean))} rows={3} /></label>
      </fieldset>
      <fieldset><legend>Footer bottom</legend>
        {input('Copyright text', 'copyright')}
        {linkList('bottomLinks', 'Bottom links')}
      </fieldset>
      <Notice message={message} /><button className="button" disabled={busy}>{busy ? 'Saving footer…' : 'Save footer'}</button>
    </form>
  );
}
function FooterManager() {
  const { data, error, reload } = useData('/admin/pages'), [edit, setEdit] = useState(null), [message, setMessage] = useState('');
  return <State data={data} error={error}>
    <Notice message={message} />
    {data?.find((page) => page.slug === 'footer') && !edit && <button className="button" onClick={() => setEdit(data.find((page) => page.slug === 'footer'))}>Edit footer</button>}
    {edit && <FooterEditor item={edit} onClose={() => setEdit(null)} onSave={() => { setEdit(null); setMessage('Footer saved successfully.'); reload(); }} />}
  </State>;
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
          The visible page name belongs in <strong>Page title</strong>. Keep the reserved URL slugs
          <strong> home</strong> and <strong>about</strong> unchanged so the main navigation keeps working.
          For the <strong>home</strong> page, use the Homepage Builder to edit the hero, metrics, sports cards, and community cards.
          Extra pages are accessible at /pages/your-slug.
        </p>
      )}
      <Notice message={message} />
      {edit && (
        kind === 'pages' && edit.slug === 'home' ? <HomeEditor
          key={edit.id || 'home'}
          item={edit}
          onClose={() => setEdit(null)}
          onSave={() => {
            setEdit(null);
            setMessage('Homepage saved successfully.');
            reload();
          }}
        /> : <Editor
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
function UserEditor({ item, onClose, onSave }) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <form
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
        } catch (error) {
          setMessage(error.message);
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
        <span>{item.id ? 'New password (leave blank to keep current)' : 'Password (12+ characters)'}</span>
        <input name="password" type="password" minLength={12} maxLength={128} required={!item.id} />
      </label>
      <label className="field">
        <span>Account role</span>
        <select name="role" defaultValue={item.role || 'member'}>
          <option value="member">Member</option>
          <option value="admin">Administrator</option>
        </select>
      </label>
      <Notice message={message} />
      <button className="button" disabled={busy}>
        {busy ? 'Saving…' : item.id ? 'Save member' : 'Create member'}
      </button>
    </form>
  );
}
function MemberManager() {
  const { data, error, reload } = useData('/admin/users'),
    [edit, setEdit] = useState(null),
    [message, setMessage] = useState('');
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
      <p>Manage member profiles, administrator access, roles, and password resets from one place.</p>
      <Notice message={message} />
      {edit && (
        <UserEditor
          key={edit.id || 'new'}
          item={edit}
          onClose={() => setEdit(null)}
          onSave={() => {
            setEdit(null);
            setMessage('Account saved successfully.');
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
                      setMessage('Account deleted.');
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
              {['bookings', 'registrations'].includes(key) && (
                <Action
                  className="text-button danger"
                  onClick={async () => {
                    if (!window.confirm('Cancel this reservation?')) return;
                    try {
                      await api('/admin/' + key + '/' + row.id, { method: 'DELETE' });
                      setMessage('Reservation cancelled.');
                      reload();
                    } catch (e) {
                      setMessage(e.message);
                    }
                  }}
                >
                  Cancel
                </Action>
              )}
            </div>
          ))}
        </div>
      ))}
    </State>
  );
}
export default function Admin() {
  const [tab, setTab] = useState('overview');
  const groups = [
    { label: 'Workspace', items: [{ id: 'overview', label: 'Overview' }] },
    {
      label: 'Content',
      items: [
        { id: 'pages', label: 'Pages' },
        { id: 'footer', label: 'Footer' },
        { id: 'programs', label: 'Programs' },
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
    { label: 'People', items: [{ id: 'members', label: 'Members & access' }] },
  ];
  return (
    <section className="section">
      <Heading eyebrow="GVK ADMINISTRATION" title="Manage your academy." />
      <div className="admin-shell">
        <nav aria-label="Admin sections" className="admin-nav">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <span className="admin-nav-label">{group.label}</span>
              {group.items.map((item) => (
                <button key={item.id} className={tab === item.id ? 'selected' : ''} onClick={() => setTab(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-main">
          {tab === 'overview' ? (
            <Overview />
          ) : tab === 'members' ? (
            <MemberManager />
          ) : tab === 'footer' ? (
            <FooterManager />
          ) : (
            <ContentManager key={tab} kind={tab} />
          )}
        </div>
      </div>
    </section>
  );
}
