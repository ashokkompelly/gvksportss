import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Users, Building2, Trophy, Pause, Play, School } from 'lucide-react';
import { useData, State, Empty } from '../components/ui';
import { usePageContent } from '../lib/content';
import { visibleItems } from '../../../../shared/siteContent';

const icons = { trophy: Trophy, building: Building2, users: Users, school: School };
function ButtonLink({ action, className = 'button gold' }) {
  return action.label && action.href ? (
    <Link className={className} to={action.href}>
      {action.label} <ArrowUpRight size={18} />
    </Link>
  ) : null;
}
function SectionTitle({ section, children }) {
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{section.eyebrow}</span>
        <h2 style={{ whiteSpace: 'pre-line' }}>{section.title}</h2>
      </div>
      {section.description && <p>{section.description}</p>}
      {children}
    </div>
  );
}
export default function Home() {
  const { data, error, page, content } = usePageContent('home');
  const events = useData('/catalog/events');
  const [heroSlide, setHeroSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slides = visibleItems(content?.hero.slides);
  const activeIndex = slides.length ? heroSlide % slides.length : 0;
  const slide = slides[activeIndex];
  const upcomingEvents = (events.data || [])
    .filter((event) => new Date(event.start) > new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const featuredEvent =
    upcomingEvents.find((event) => event.sport === content?.calendar.preferredSport) ||
    upcomingEvents[0];
  useEffect(() => {
    if (
      paused ||
      !content?.hero.enabled ||
      slides.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const timer = window.setInterval(
      () => setHeroSlide((current) => (current + 1) % slides.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [paused, slides.length, content?.hero.enabled]);
  if (!page)
    return (
      <section className="section">
        <State data={data} error={error}>
          <Empty>This page is not currently published.</Empty>
        </State>
      </section>
    );
  const { hero, audiences, services, calendar, process, training } = content;
  return (
    <>
      {hero.enabled && slide && (
        <section className="hero event-hero" aria-label="Sports event management highlights">
          <div className="hero-copy">
            <div className="hero-copy-stack">
              {slides.map((item, index) => (
                <div
                  key={item.id}
                  className={`hero-copy-slide${index === activeIndex ? ' active' : ''}`}
                  aria-hidden={index !== activeIndex}
                >
                  <span className="eyebrow">{item.label}</span>
                  <h1>{item.title}</h1>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
            <div className="actions">
              <ButtonLink action={hero.primaryAction} />
              <ButtonLink action={hero.secondaryAction} className="button outline" />
            </div>
            <div className="hero-foot">
              {hero.highlights.map((text, index) => (
                <span key={index}>{text}</span>
              ))}
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-slider">
              {slides.map((item, index) => (
                <img
                  key={item.id}
                  className={`${index === activeIndex ? 'active' : ''}${item.containImage ? ' contained' : ''}`}
                  src={item.image || undefined}
                  alt={item.alt}
                  aria-hidden={index !== activeIndex}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              ))}
              <div className="hero-slider-caption">
                {slides.map((item, index) => (
                  <div
                    key={item.id}
                    className={`hero-caption-slide${index === activeIndex ? ' active' : ''}`}
                    aria-hidden={index !== activeIndex}
                  >
                    <span>{hero.captionLabel}</span>
                    <strong>{item.caption}</strong>
                  </div>
                ))}
              </div>
              <div className="hero-slider-dots">
                {slides.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={index === activeIndex ? 'active' : ''}
                    onClick={() => {
                      setHeroSlide(index);
                      setPaused(true);
                    }}
                    aria-label={`Show ${item.label}`}
                    aria-pressed={index === activeIndex}
                  />
                ))}
                <button
                  type="button"
                  className="slider-pause"
                  onClick={() => setPaused(!paused)}
                  aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
                >
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
      {audiences.enabled && (
        <section className="section event-services">
          <SectionTitle section={audiences} />
          <div className="grid three">
            {visibleItems(audiences.cards).map((service, index) => {
              const Icon = icons[service.icon] || Trophy;
              return (
                <Link className="event-service-card" key={service.id} to={service.href}>
                  <div className="service-card-top">
                    <Icon size={30} />
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <span className="service-link">
                    {audiences.actionLabel}
                    <ArrowUpRight size={19} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      {services.enabled && (
        <section className="section dedicated-services" id="services">
          <SectionTitle section={services} />
          <div className="sport-services-grid">
            {visibleItems(services.groups).map((group) => (
              <article className={'service-discipline ' + group.sport.toLowerCase()} key={group.id}>
                <span className="eyebrow">{group.label}</span>
                <h3>{group.sport}</h3>
                <p>{group.description}</p>
                <ul>
                  {visibleItems(group.items).map((item) => (
                    <li key={item.id}>
                      <Link to={item.href}>
                        {item.label}
                        <ArrowUpRight size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}
      {calendar.enabled && (
        <section className="section home-event-section">
          <SectionTitle section={calendar}>
            <ButtonLink action={calendar.action} className="light-link" />
          </SectionTitle>
          {featuredEvent ? (
            <div className={'home-event-feature' + (featuredEvent.image ? '' : ' without-image')}>
              {featuredEvent.image && (
                <div className="home-event-media">
                  <img
                    src={featuredEvent.image}
                    alt={featuredEvent.imageAlt || featuredEvent.title}
                    loading="lazy"
                  />
                  <span className="badge">{calendar.badge}</span>
                </div>
              )}
              <div className="home-event-copy">
                <span className="eyebrow">{featuredEvent.sport}</span>
                <h2>{featuredEvent.title}</h2>
                <p>{featuredEvent.description}</p>
                <div className="event-meta">
                  {new Date(featuredEvent.start).toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                  })}
                </div>
                <ButtonLink action={calendar.eventAction} />
              </div>
            </div>
          ) : (
            <State data={events.data} error={events.error}>
              <div className="event-calendar-empty">
                <Trophy size={34} />
                <div>
                  <h3>{calendar.emptyTitle}</h3>
                  <p>{calendar.emptyDescription}</p>
                </div>
                <ButtonLink action={calendar.emptyAction} />
              </div>
            </State>
          )}
        </section>
      )}
      {process.enabled && (
        <section className="section event-process">
          <SectionTitle section={process}>
            <ButtonLink action={process.action} className="button outline" />
          </SectionTitle>
          <div className="grid three">
            {visibleItems(process.steps).map((step, index) => (
              <article className="event-step" key={step.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {training.enabled && (
        <section className="section home-coaching chess-training-feature">
          <SectionTitle section={training}>
            <span className="badge">{training.badge}</span>
          </SectionTitle>
          <div className="chess-training-grid">
            <div>
              <h3>{training.trainerTitle}</h3>
              {training.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <div className="actions">
                <ButtonLink action={training.primaryAction} />
                <ButtonLink action={training.secondaryAction} className="light-link" />
              </div>
            </div>
            <div className="training-platform">
              <span className="eyebrow">{training.platform.eyebrow}</span>
              <h3>{training.platform.title}</h3>
              <p>{training.platform.description}</p>
              <ButtonLink action={training.platform.action} className="light-link" />
              <div className="badminton-note">
                <strong>{training.secondary.title}</strong>
                <p>{training.secondary.description}</p>
                <ButtonLink action={training.secondary.action} className="light-link" />
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
