import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { pageDefaults, mergeContent } from '../../../../shared/siteContent';
import { api } from '../lib/api';
import { Fields, labelFor, newEntry } from './ContentFields';
import AdminModal from './AdminModal';
import AdminPreview from './AdminPreview';

const read = (root, path) => path.reduce((value, key) => value?.[key], root);
function write(root, path, value) {
  const next = structuredClone(root);
  const parent = path.slice(0, -1).reduce((node, key) => node[key], next);
  parent[path.at(-1)] = value;
  return next;
}
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const collections = (value, path = []) =>
  Object.entries(value).flatMap(([key, entry]) =>
    Array.isArray(entry) && object(entry[0])
      ? [{ path: [...path, key], template: entry[0] }]
      : object(entry)
        ? collections(entry, [...path, key])
        : [],
  );

function SectionForm({ edit, busy, onChange, onSubmit, onClose }) {
  const ref = useRef(null);
  const [added, setAdded] = useState(null);
  useEffect(() => {
    if (!added) return;
    const entry = ref.current?.querySelector(`[data-content-id="${added}"]`);
    const details = entry?.querySelector('details');
    if (details) details.open = true;
    entry?.querySelector('input, textarea, select')?.focus();
  }, [added]);
  return (
    <form
      ref={ref}
      className="form page-content-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="muted">
        Save updates this component on the website. Hidden items remain available here.
      </p>
      <div className="modal-fields">
        <Fields
          value={edit.value}
          template={edit.template}
          path={edit.path.join('.')}
          onChange={onChange}
          onItemAdded={setAdded}
        />
      </div>
      <div className="content-save-bar">
        <button type="submit" className="button gold" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="button outline" disabled={busy} onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function VisualPageEditor({ item, onSave, onClose, onAddEvent }) {
  const defaults = pageDefaults[item.slug];
  const [saved, setSaved] = useState(null);
  const page = saved || { ...item, config: mergeContent(defaults.config, item.config) };
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const open = (path, template, title) =>
    setEdit({
      path,
      template,
      title,
      value: structuredClone(read(page, path)),
      original: structuredClone(read(page, path)),
    });
  const persist = async (next) => {
    setBusy(true);
    try {
      const result = await api('/admin/pages' + (page.id ? '/' + page.id : ''), {
        method: page.id ? 'PUT' : 'POST',
        body: next,
      });
      setSaved(result);
      setEdit(null);
      onSave?.(result);
    } catch {
      /* Persistent API notification leaves the form available for correction. */
    } finally {
      setBusy(false);
    }
  };
  const add = (path, template, title) => {
    const value = newEntry(template);
    setEdit({
      path: [...path, (read(page, path) || []).length],
      template,
      title,
      value,
      original: structuredClone(value),
      add: true,
    });
  };
  const title = item.slug === 'about' ? 'About & team' : labelFor(item.slug);
  const kindFor = (path) =>
    path.includes('members')
      ? 'team'
      : path.includes('slides')
        ? 'slide'
        : item.slug === 'coaching' && path.includes('cards')
          ? 'coaching'
          : path.includes('steps')
            ? 'step'
            : path.includes('groups')
              ? 'service'
              : path.includes('audiences')
                ? 'audience'
                : '';
  const renderCollection = ({ path, template }) => {
    const entries = read(page, path) || [];
    const key = path.at(-1);
    const label = key === 'items' && item.slug === 'header' ? 'Menu items' : labelFor(key);
    return (
      <div className="visual-collection" key={path.join('.')} data-collection={path.join('.')}>
        <div className="section-title">
          <h3>{label}</h3>
          <button
            type="button"
            className="button outline small"
            onClick={() => add(path, template, 'Add ' + label.toLowerCase())}
          >
            <Plus size={16} />
            Add {label.toLowerCase()}
          </button>
        </div>
        {!entries.length && <p className="empty">No items yet. Add the first one.</p>}
        <div className={'visual-card-grid ' + (key === 'slides' ? 'visual-slides' : '')}>
          {entries.map((entry, index) => (
            <article className="visual-editable" key={entry.id || index}>
              <div className="visual-toolbar">
                <span className="badge">{entry.published === false ? 'Hidden' : 'Published'}</span>
                <button
                  type="button"
                  className="button gold small"
                  onClick={() =>
                    open(
                      [...path, index],
                      template,
                      entry.name || entry.title || entry.label || label,
                    )
                  }
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
              <AdminPreview value={entry} kind={kindFor(path)} />
              <div className="visual-item-actions">
                <button
                  type="button"
                  className="text-button"
                  disabled={index === 0 || busy}
                  aria-label={`Move ${label} ${index + 1} up`}
                  onClick={() => {
                    const next = [...entries];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    persist(write(page, path, next));
                  }}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={index === entries.length - 1 || busy}
                  aria-label={`Move ${label} ${index + 1} down`}
                  onClick={() => {
                    const next = [...entries];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    persist(write(page, path, next));
                  }}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  className="text-button danger"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm('Remove this item from the website?'))
                      persist(
                        write(
                          page,
                          path,
                          entries.filter((_, i) => i !== index),
                        ),
                      );
                  }}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  };
  const scalarConfig = Object.fromEntries(
    Object.entries(defaults.config).filter(([, value]) => !object(value) && !Array.isArray(value)),
  );
  return (
    <div className="visual-page-editor" aria-busy={busy}>
      <div className="section-title">
        <div>
          <span className="eyebrow">WEBSITE EDITOR</span>
          <h2>{title}</h2>
          <p>Choose a component below, then edit it in a popup.</p>
        </div>
        <div className="actions">
          <Link
            className="button outline small"
            target="_blank"
            to={['home', 'header'].includes(item.slug) ? '/' : '/' + item.slug}
          >
            View website
          </Link>
          {onClose && (
            <button className="text-button" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
      <div className="actions visual-quick-actions">
        {item.slug === 'about' && (
          <button
            className="button gold"
            onClick={() =>
              add(
                ['config', 'team', 'members'],
                defaults.config.team.members[0],
                'Add new team member',
              )
            }
          >
            Add new team member
          </button>
        )}
        {item.slug === 'coaching' && (
          <button
            className="button gold"
            onClick={() =>
              add(['config', 'cards'], defaults.config.cards[0], 'Add new coaching card')
            }
          >
            Add new coaching card
          </button>
        )}
        {item.slug === 'events' && onAddEvent && (
          <button className="button gold" onClick={onAddEvent}>
            Add new event
          </button>
        )}
      </div>
      {item.slug === 'header' && (
        <section className="visual-section">
          <AdminPreview value={page.config} kind="header" />
        </section>
      )}
      <section className="visual-section">
        <div className="visual-toolbar">
          <span className="badge">{page.published ? 'Published page' : 'Hidden page'}</span>
          <button
            className="button outline small"
            onClick={() =>
              open(
                [],
                {
                  title: defaults.title,
                  body: defaults.body,
                  published: true,
                  ...(Object.keys(scalarConfig).length ? { config: scalarConfig } : {}),
                },
                'Page heading & settings',
              )
            }
          >
            Edit page settings
          </button>
        </div>
        <AdminPreview value={{ ...page, eyebrow: page.config.eyebrow }} />
      </section>
      {Object.entries(defaults.config)
        .filter(([, value]) => object(value) || Array.isArray(value))
        .map(([key, template]) => {
          const path = ['config', key];
          if (Array.isArray(template)) return renderCollection({ path, template: template[0] });
          const value = page.config[key];
          const nestedCollections = collections(template, path);
          // Collection cards have their own edit buttons; section settings stay compact.
          const settings = Object.fromEntries(
            Object.entries(template).filter(
              ([, entry]) => !Array.isArray(entry) || !object(entry[0]),
            ),
          );
          return (
            <section className={'visual-section visual-section-' + key} key={key}>
              <div className="visual-toolbar">
                <span className="eyebrow">
                  {labelFor(key)}
                  {value.enabled === false ? ' · Hidden' : ''}
                </span>
                <button
                  className="button gold small"
                  onClick={() => open(path, settings, labelFor(key))}
                >
                  <Pencil size={14} />
                  Edit {labelFor(key).toLowerCase()}
                </button>
              </div>
              <AdminPreview value={value} />
              {Object.entries(template)
                .filter(
                  ([childKey, child]) =>
                    object(child) && ['platform', 'secondary'].includes(childKey),
                )
                .map(([childKey, child]) => (
                  <div className="visual-section" key={childKey}>
                    <div className="visual-toolbar">
                      <span className="eyebrow">{labelFor(childKey)}</span>
                      <button
                        className="button outline small"
                        onClick={() => open([...path, childKey], child, labelFor(childKey))}
                      >
                        Edit {labelFor(childKey).toLowerCase()}
                      </button>
                    </div>
                    <AdminPreview value={value[childKey]} />
                  </div>
                ))}
              {nestedCollections.map(renderCollection)}
            </section>
          );
        })}
      {edit && (
        <AdminModal
          title={edit.title}
          onClose={() => setEdit(null)}
          busy={busy}
          dirty={JSON.stringify(edit.value) !== JSON.stringify(edit.original)}
        >
          <SectionForm
            edit={edit}
            busy={busy}
            onChange={(value) => setEdit({ ...edit, value })}
            onSubmit={() =>
              persist(edit.path.length ? write(page, edit.path, edit.value) : edit.value)
            }
          />
        </AdminModal>
      )}
    </div>
  );
}
