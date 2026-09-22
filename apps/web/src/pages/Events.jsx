import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, useData, State, Empty, Notice, Action } from '../components/ui';
import { api, date } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
export default function Events() {
  const { data, error, reload } = useData('/catalog/events'),
    { user } = useAuth(),
    navigate = useNavigate();
  const [past, setPast] = useState(false),
    [message, setMessage] = useState('');
  const items = data?.filter((e) => new Date(e.start) <= new Date() === past);
  return (
    <section className="section">
      <Heading eyebrow="COME TOGETHER. COMPETE. CELEBRATE." title="More than a game.">
        Chess and badminton events for players, families and communities.
      </Heading>
      <div className="filters">
        <button className={!past ? 'selected' : ''} onClick={() => setPast(false)}>
          Upcoming
        </button>
        <button className={past ? 'selected' : ''} onClick={() => setPast(true)}>
          Past events
        </button>
      </div>
      <Notice message={message} />
      <State data={data} error={error}>
        {!items?.length && (
          <Empty>
            {past
              ? 'Past events will appear here.'
              : 'Upcoming events will be announced here. Check back soon.'}
          </Empty>
        )}
        <div className="grid two">
          {items?.map((e) => (
            <article className="card event-card" key={e.id}>
              <span className="badge">
                {e.sport} {e.membersOnly ? '· Members only' : ''}
              </span>
              <h2>{e.title}</h2>
              <p>{e.description}</p>
              <p>
                {date(e.start)}
                <br />
                {e.location}
              </p>
              {!past && (
                <div className="card-bottom">
                  <span>{e.remaining} places left</span>
                  <Action
                    disabled={e.remaining < 1}
                    onClick={async () => {
                      if (!user) return navigate('/login');
                      try {
                        await api('/member/registrations', { method: 'POST', body: { id: e.id } });
                        setMessage('You’re registered. View your event in My GVK.');
                        reload();
                      } catch (e) {
                        setMessage(e.message);
                      }
                    }}
                  >
                    Register
                  </Action>
                </div>
              )}
            </article>
          ))}
        </div>
      </State>
    </section>
  );
}
