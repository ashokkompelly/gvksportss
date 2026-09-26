import { useState } from 'react';
import { teamMemberTemplate } from '../../../../shared/siteContent';
import { useData, State, Action } from './ui';
import { Fields, newEntry } from './ContentFields';
import AdminModal from './AdminModal';
import AdminPreview from './AdminPreview';
import { api } from '../lib/api';

export default function TeamManager() {
  const { data, error, reload } = useData('/admin/team');
  const [edit, setEdit] = useState(null);
  const [initial, setInitial] = useState(null);
  const [busy, setBusy] = useState(false);
  const open = (member) => {
    setInitial(structuredClone(member));
    setEdit(structuredClone(member));
  };
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api('/admin/team' + (edit.id ? '/' + edit.id : ''), {
        method: edit.id ? 'PUT' : 'POST',
        body: edit,
      });
      setEdit(null);
      reload();
    } catch {
      /* The API notification keeps the form available for corrections. */
    } finally {
      setBusy(false);
    }
  };
  const move = async (index, offset) => {
    const ids = data.map((member) => member.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    await api('/admin/team/order', { method: 'PUT', body: { ids } });
    reload();
  };
  return (
    <State data={data} error={error}>
      <div className="section-title">
        <div>
          <h2>Team members</h2>
          <p>Manage profiles, photos, achievements and their order on the About page.</p>
        </div>
        <button
          className="button gold"
          onClick={() =>
            open({
              ...newEntry(teamMemberTemplate),
              order: Math.max(-1, ...(data || []).map((member) => member.order)) + 1,
            })
          }
        >
          Add team member
        </button>
      </div>
      {!data?.length && <p className="empty">No team members yet. Add the first profile.</p>}
      <div className="visual-card-grid">
        {data?.map((member, index) => (
          <article key={member.id} className="visual-editable">
            <div className="visual-toolbar">
              <span className="badge">{member.published ? 'Published' : 'Hidden'}</span>
              <button className="button gold small" onClick={() => open(member)}>
                Edit {member.name}
              </button>
            </div>
            <AdminPreview kind="team" value={member} />
            <div className="visual-item-actions">
              <Action
                className="text-button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                Move up
              </Action>
              <Action
                className="text-button"
                disabled={index === data.length - 1}
                onClick={() => move(index, 1)}
              >
                Move down
              </Action>
              <Action
                className="text-button"
                onClick={async () => {
                  await api('/admin/team/' + member.id, {
                    method: 'PUT',
                    body: { ...member, published: !member.published },
                  });
                  reload();
                }}
              >
                {member.published ? 'Hide' : 'Publish'}
              </Action>
              <Action
                className="text-button"
                onClick={async () => {
                  if (!window.confirm('Delete ' + member.name + '?')) return;
                  await api('/admin/team/' + member.id, { method: 'DELETE' });
                  reload();
                }}
              >
                Delete
              </Action>
            </div>
          </article>
        ))}
      </div>
      {edit && (
        <AdminModal
          title={edit.id ? 'Edit team member' : 'Add team member'}
          busy={busy}
          dirty={JSON.stringify(edit) !== JSON.stringify(initial)}
          onClose={() => setEdit(null)}
        >
          <form className="form page-content-editor" onSubmit={save}>
            <Fields value={edit} template={teamMemberTemplate} onChange={setEdit} />
            <div className="content-save-bar">
              <button className="button gold" disabled={busy}>
                {busy ? 'Saving…' : 'Save profile'}
              </button>
              <button
                type="button"
                className="button outline"
                disabled={busy}
                onClick={() => setEdit(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </State>
  );
}
