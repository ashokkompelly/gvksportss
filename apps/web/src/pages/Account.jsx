import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heading, useData, State, Empty, Notice, Action } from '../components/ui';
import { api, date, money } from '../lib/api';
export default function Account() {
  const { user } = useAuth(),
    { data, error, reload } = useData('/member'),
    plans = useData('/catalog/plans');
  const [message, setMessage] = useState('');
  async function act(path, method, body) {
    try {
      await api(path, { method, body });
      setMessage('Your account has been updated.');
      reload();
    } catch (e) {
      setMessage(e.message);
    }
  }
  return (
    <section className="section">
      <Heading eyebrow="MY GVK" title={`Welcome back, ${user.name.split(' ')[0]}.`}>
        Your sessions, events and membership in one place.
      </Heading>
      <Notice message={message} />
      <State data={data} error={error}>
        <div className="grid two">
          {[
            ['bookings', 'Your coaching sessions'],
            ['registrations', 'Your events'],
          ].map(([key, title]) => (
            <article className="card" key={key}>
              <h2>{title}</h2>
              {!data?.[key].length && (
                <Empty>
                  No reservations yet.{' '}
                  <Link to={key === 'bookings' ? '/coaching' : '/events'}>Explore →</Link>
                </Empty>
              )}
              {data?.[key].map((b) => (
                <div className="list-row" key={b.id}>
                  <div>
                    <strong>{b.item.title}</strong>
                    <p>{date(b.item.start)}</p>
                  </div>
                  <Action
                    className="text-button"
                    onClick={async () => {
                      if (window.confirm('Cancel this reservation?'))
                        await act('/member/' + key + '/' + b.id, 'DELETE');
                    }}
                  >
                    Cancel
                  </Action>
                </div>
              ))}
            </article>
          ))}
        </div>
        <h2 className="spaced">Your membership</h2>
        {data?.memberships.length ? (
          data.memberships.map((m) => (
            <article className="card membership" key={m.id}>
              <div>
                <span className="badge">
                  {m.status === 'active' && new Date(m.valid_until) <= new Date()
                    ? 'expired'
                    : m.status}
                </span>
                <h3>{m.item.title}</h3>
                <p>
                  {m.status === 'pending'
                    ? 'Awaiting confirmation from the GVK team.'
                    : m.valid_until
                      ? 'Valid until ' + date(m.valid_until)
                      : 'Membership request cancelled.'}
                </p>
              </div>
              {m.status !== 'cancelled' && (
                <Action
                  className="text-button"
                  onClick={async () => {
                    if (window.confirm('Cancel this membership or request?'))
                      await act('/member/memberships/' + m.id, 'DELETE');
                  }}
                >
                  Cancel membership
                </Action>
              )}
            </article>
          ))
        ) : (
          <Empty>You don’t have a membership yet.</Empty>
        )}
      </State>
      <h2 className="spaced">Membership plans</h2>
      <p>
        Request a plan below. The team confirms your membership separately; no online payment is
        collected.
      </p>
      <State {...plans}>
        <div className="grid three">
          {plans.data?.map((p) => (
            <article className="card" key={p.id}>
              <h3>{p.title}</h3>
              <strong className="price">{money(p.price)}</strong>
              <p>
                {p.durationDays} days · {p.description}
              </p>
              <Action onClick={() => act('/member/memberships', 'POST', { id: p.id })}>
                Request membership
              </Action>
            </article>
          ))}
        </div>
        {!plans.data?.length && (
          <Empty>
            Membership plans will be published soon.{' '}
            <Link to="/contact">Enquire with the team →</Link>
          </Empty>
        )}
      </State>
    </section>
  );
}
