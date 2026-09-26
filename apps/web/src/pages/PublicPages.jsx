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
  const team = useData('/catalog/team');
  const members = visibleItems(team.data || []);
  const categories = [
    ...new Set(members.flatMap((member) => [member.category, ...member.sports])),
  ].filter(Boolean);
  const activeFilter = categories.includes(filter) ? filter : 'All';

  return (
    <section className="section">
      <State
        data={slug === 'about' && team.data === null ? null : data}
        error={error || (slug === 'about' && team.error)}
      >
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
  const pageState = usePageContent('gallery');
  const { page, content } = pageState;
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
        {!data?.length && <Empty>{content.emptyMessage}</Empty>}
      </State>
    </section>
  );
}

export function Contact() {
  const [params] = useSearchParams();
  const { data, error, page, content } = usePageContent('contact');
  const footer = data?.find((page) => page.slug === 'footer')?.config;
  const phones = footer?.phones || [];
  const emails = footer?.emails || [];
  if (!page)
    return (
      <section className="section">
        <State data={data} error={error}>
          <Empty>This page is not currently published.</Empty>
        </State>
      </section>
    );
  const interest = params.get('interest') || content.defaultInterest;
  const subject = encodeURIComponent(content.subjectPrefix + interest);
  return (
    <section className="section contact-direct">
      <Heading eyebrow={content.eyebrow} title={page.title}>
        {page.body}
      </Heading>
      <div className="contact-intro">
        <span className="eyebrow">{content.intro.eyebrow}</span>
        <h2>{content.intro.title}</h2>
        <p>{content.intro.description}</p>
      </div>
      <div className="grid two">
        <article className="direct-contact-card">
          <PhoneCall size={30} />
          <span className="eyebrow">{content.phone.eyebrow}</span>
          <h2>{content.phone.title}</h2>
          <p>{content.phone.description}</p>
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
          <span className="eyebrow">{content.email.eyebrow}</span>
          <h2>{content.email.title}</h2>
          <p>{content.email.description}</p>
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
