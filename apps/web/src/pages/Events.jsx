import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heading, useData, State, Empty, Notice, Action } from '../components/ui';
import { api, date } from '../lib/api';
import { usePageContent } from '../lib/content';
import { useAuth } from '../contexts/AuthContext';
export default function Events() {
  const pageState = usePageContent('events');
  const { page, content } = pageState;
  const { data, error, reload } = useData('/catalog/events'),
    { user } = useAuth(),
    navigate = useNavigate();
  const [past, setPast] = useState(false),
    [message, setMessage] = useState('');
  const items = data?.filter((e) => new Date(e.start) <= new Date() === past);
  if (!page)
    return (
      <section className="section">
        <State data={pageState.data} error={pageState.error}>
          <Empty>This page is not currently published.</Empty>
        </State>
      </section>
    );
  return (
    <section className="section">
      <Heading eyebrow={content.eyebrow} title={page.title}>
        {page.body}
      </Heading>
      {content.callout.enabled && (
        <div className="callout" style={{ marginBottom: '28px' }}>
          <strong>{content.callout.title}</strong>
          <p>{content.callout.description}</p>
          <Link className="button gold" to={content.callout.action.href}>
            {content.callout.action.label}
          </Link>
        </div>
      )}
      <div className="filters">
        <button className={!past ? 'selected' : ''} onClick={() => setPast(false)}>
          {content.upcomingLabel}
        </button>
        <button className={past ? 'selected' : ''} onClick={() => setPast(true)}>
          {content.pastLabel}
        </button>
      </div>
      <Notice message={message} />
      <State data={data} error={error}>
        {!items?.length && <Empty>{past ? content.emptyPast : content.emptyUpcoming}</Empty>}
        <div className="grid two">
          {items?.map((e) => (
            <article className="card event-card" key={e.id}>
              {e.image && (
                <div className="event-card-media">
                  <img src={e.image} alt={e.imageAlt || e.title} loading="lazy" />
                </div>
              )}
              <span className="badge">
                {e.sport} {e.membersOnly ? '· ' + content.membersLabel : ''}
              </span>
              <h2>{e.title}</h2>
              <p>{e.description}</p>
              <p>{date(e.start)}</p>
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
                    {content.registerLabel}
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
