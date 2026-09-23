import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, useData, State, Empty, Notice, Action } from '../components/ui';
import { api, date } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
const fallbackEventImages = {
  Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85',
  Chess: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1200&q=85',
};
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
              <div className="event-card-media" style={{ backgroundImage: `url(${e.image || fallbackEventImages[e.sport]})` }} aria-hidden="true" />
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
