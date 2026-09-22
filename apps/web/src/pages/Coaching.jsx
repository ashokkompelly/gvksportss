import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Heading, useData, State, Empty, Notice, Action } from '../components/ui';
import { api, date } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
export default function Coaching() {
  const [params, setParams] = useSearchParams();
  const sport = params.get('sport') || 'All';
  const programs = useData('/catalog/programs'),
    slots = useData('/catalog/slots');
  const { user } = useAuth(),
    navigate = useNavigate();
  const [message, setMessage] = useState('');
  async function book(id) {
    if (!user) return navigate('/login');
    try {
      await api('/member/bookings', { method: 'POST', body: { id } });
      setMessage('Your place is booked. View it in My GVK.');
      slots.reload();
    } catch (e) {
      setMessage(e.message);
    }
  }
  return (
    <section className="section">
      <Heading eyebrow="COACHING AT GVK" title="Find your rhythm. Build your game.">
        Choose your sport, explore a program and reserve an available session.
      </Heading>
      <div className="filters" aria-label="Filter by sport">
        {['All', 'Badminton', 'Chess'].map((s) => (
          <button
            key={s}
            aria-pressed={sport === s}
            className={sport === s ? 'selected' : ''}
            onClick={() => setParams(s === 'All' ? {} : { sport: s })}
          >
            {s}
          </button>
        ))}
      </div>
      <State {...programs}>
        <div className="grid three">
          {programs.data
            ?.filter((p) => sport === 'All' || p.sport === sport)
            .map((p) => (
              <article key={p.id} className="card">
                <span className="badge">
                  {p.sport} / {p.level}
                </span>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <small>{p.mode}</small>
              </article>
            ))}
        </div>
      </State>
      <div className="section-title spaced">
        <h2>Book a coaching session</h2>
        <Link to="/account">My bookings →</Link>
      </div>
      <Notice message={message} />
      <State {...slots}>
        {!slots.data?.filter(
          (s) => (sport === 'All' || s.sport === sport) && new Date(s.start) > new Date(),
        ).length && (
          <Empty>
            New sessions are being planned. <Link to="/contact">Ask about available batches →</Link>
          </Empty>
        )}
        <div className="grid two">
          {slots.data
            ?.filter(
              (s) => (sport === 'All' || s.sport === sport) && new Date(s.start) > new Date(),
            )
            .map((s) => (
              <article className="card" key={s.id}>
                <span className="badge">
                  {s.sport}
                  {s.membersOnly ? ' · Members only' : ''}
                </span>
                <h3>{s.title}</h3>
                <p>
                  {date(s.start)}
                  <br />
                  {s.location}
                </p>
                <div className="card-bottom">
                  <span>{s.remaining} places left</span>
                  <Action disabled={s.remaining < 1} onClick={() => book(s.id)}>
                    {s.remaining < 1 ? 'Full' : 'Book session'}
                  </Action>
                </div>
              </article>
            ))}
        </div>
      </State>
    </section>
  );
}
