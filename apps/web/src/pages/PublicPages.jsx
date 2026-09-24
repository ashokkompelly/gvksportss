import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Heading, useData, State, Empty } from '../components/ui';
import { visibleItems } from '../../../../shared/siteContent';
import { usePageContent } from '../lib/content';
import TeamAchievements from '../components/TeamAchievements';
import { ArrowUpRight, PhoneCall, Mail, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export function ContentPage({ slug: fixed }) {
  const params = useParams();
  const slug = fixed || params.slug;
  const { data, error, page, content: pageContent } = usePageContent(slug);
  const [filter, setFilter] = useState('All');
  const content = slug === 'about' ? pageContent : null;
  const members = visibleItems(content?.team.members);
  const categories = [
    ...new Set(members.flatMap((member) => [member.category, ...member.sports])),
  ].filter(Boolean);
  const activeFilter = categories.includes(filter) ? filter : 'All';

  return (
    <section className="section">
      <State data={data} error={error}>
        {page ? (
          <>
            <Heading eyebrow={content?.eyebrow || 'GVK SPORTSS'} title={page.title} />
            <p className="prose">{page.body}</p>

            {slug === 'about' && content.team.enabled && (
              <div style={{ marginTop: '50px' }}>
                <div className="section-title">
                  <div>
                    <span className="eyebrow">
                      <Sparkles size={14} /> {content.team.eyebrow}
                    </span>
                    <h2>{content.team.title}</h2>
                  </div>
                  <p>{content.team.description}</p>
                </div>

                {/* Filter buttons for people categories */}
                <div className="filters" style={{ marginBottom: '24px' }}>
                  {['All', ...categories].map((cat) => (
                    <button
                      key={cat}
                      className={activeFilter === cat ? 'selected' : ''}
                      aria-pressed={activeFilter === cat}
                      onClick={() => setFilter(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid three">
                  {members
                    .filter(
                      (m) =>
                        activeFilter === 'All' ||
                        m.category === activeFilter ||
                        m.sports.includes(activeFilter),
                    )
                    .map((m) => (
                      <article className="coach-card" key={m.id}>
                        {m.image && (
                          <img
                            className="coach-photo"
                            src={m.image}
                            alt={m.imageAlt}
                            loading="lazy"
                          />
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <span className="coach-exp-badge">
                            <Award size={13} /> {m.experience}
                          </span>
                          <span className="badge">{m.category}</span>
                        </div>

                        <h3 style={{ fontSize: '20px', margin: '4px 0 2px' }}>{m.name}</h3>
                        <div
                          style={{
                            color: 'var(--gold-bright)',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          {m.role}
                        </div>

                        <div className="coach-domain-tag">
                          <strong>Domain:</strong> {m.domain}
                        </div>

                        <p style={{ fontSize: '13px', margin: '12px 0 0', flex: 1 }}>{m.bio}</p>

                        <div
                          style={{
                            marginTop: '16px',
                            paddingTop: '12px',
                            borderTop: '1px solid var(--line)',
                            fontSize: '12px',
                            color: 'var(--muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <CheckCircle2 size={13} color="var(--gold)" />
                          <span>{m.certification}</span>
                        </div>
                        <TeamAchievements
                          member={m}
                          buttonLabel={content.team.achievementButton}
                          eyebrow={content.team.achievementEyebrow}
                        />
                      </article>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Empty>This page is not currently published.</Empty>
        )}
      </State>
    </section>
  );
}

export function Gallery() {
  const { data, error } = useData('/catalog/gallery');
  return (
    <section className="section">
      <Heading eyebrow="IN THE FRAME" title="Moments That Bring Us Together">
        Glimpses of competitive rallies, tactical masterclasses, and championship celebrations.
      </Heading>
      <State data={data} error={error}>
        <div className="gallery">
          {data?.map((i) => (
            <figure key={i.id}>
              <a href={i.url} target="_blank" rel="noreferrer">
                <img src={i.url} alt={i.title} loading="lazy" />
              </a>
              <figcaption>
                <h3>{i.title}</h3>
                <p>{i.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        {!data?.length && <Empty>Photos and highlights will appear here soon.</Empty>}
      </State>
    </section>
  );
}

export function Contact() {
  const [params] = useSearchParams();
  const { data } = useData('/catalog/pages');
  const footer = data?.find((page) => page.slug === 'footer')?.config;
  const phones = footer?.phones || ['+91 94920 63258', '+91 91234 56789'];
  const emails = footer?.emails || ['gvksportss@gmail.com'];
  const interest = params.get('interest') || 'Sports event management';
  const subject = encodeURIComponent('GVK Sportss enquiry: ' + interest);
  return (
    <section className="section contact-direct">
      <Heading eyebrow="LET'S TALK EVENTS" title="Great events start here.">
        Planning a tournament, corporate sports day or community competition? Call or email our team
        to bring your ideas to life.
      </Heading>
      <div className="contact-intro">
        <span className="eyebrow">YOUR NEXT EVENT</span>
        <h2>One conversation. A world of possibilities.</h2>
        <p>
          Share your preferred dates, sports and group size. We will help you take the next step.
          Personal chess training, Chesslang coaching and free demo enquiries are welcome too. We
          also offer badminton coaching.
        </p>
      </div>
      <div className="grid two">
        <article className="direct-contact-card">
          <PhoneCall size={30} />
          <span className="eyebrow">CALL OUR TEAM</span>
          <h2>Let's talk through your ideas.</h2>
          <p>Speak directly with our events and coaching team.</p>
          <div className="direct-contact-links">
            {phones.map((phone) => (
              <a key={phone} href={'tel:' + phone.replace(/[^+\d]/g, '')}>
                {phone}
                <ArrowUpRight size={20} />
              </a>
            ))}
          </div>
        </article>
        <article className="direct-contact-card">
          <Mail size={30} />
          <span className="eyebrow">SEND AN EMAIL</span>
          <h2>Tell us what you have in mind.</h2>
          <p>Send your event brief or ask us about our services.</p>
          <div className="direct-contact-links">
            {emails.map((email) => (
              <a key={email} href={'mailto:' + email + '?subject=' + subject}>
                {email}
                <ArrowUpRight size={20} />
              </a>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
