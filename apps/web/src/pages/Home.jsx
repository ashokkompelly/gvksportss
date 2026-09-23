import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  MoveRight,
  Users,
  Building2,
  School,
  Sparkles,
} from 'lucide-react';
import { useData, State } from '../components/ui';
import { TrainingAssessmentWidget } from '../components/AnimatedComponents';

const iconMap = { school: School, users: Users, building: Building2 };

export default function Home() {
  const { data, error } = useData('/catalog/pages');
  const events = useData('/catalog/events');
  const home = data?.find((p) => p.slug === 'home');
  const content = home?.config;
  const [heroSlide, setHeroSlide] = useState(0);
  const [eventSlide, setEventSlide] = useState(0);
  const upcomingEvents = events.data?.filter((event) => new Date(event.start) > new Date()) || [];
  const featuredEvent = upcomingEvents[eventSlide];
  const heroSlides = content ? [
    { image: content.heroImage, label: content.heroLabel, standard: content.heroStandard },
    ...content.sports.filter((sport) => sport.image).map((sport) => ({ image: sport.image, label: sport.title, standard: 'Train with purpose. Compete with confidence.' })),
    ...(featuredEvent?.image ? [{ image: featuredEvent.image, label: 'ARENA EVENTS', standard: featuredEvent.title }] : []),
  ] : [];

  useEffect(() => {
    if (heroSlides.length < 2) return undefined;
    const timer = window.setInterval(() => setHeroSlide((current) => (current + 1) % heroSlides.length), 5000);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (upcomingEvents.length < 2) return undefined;
    const timer = window.setInterval(() => setEventSlide((current) => (current + 1) % upcomingEvents.length), 6500);
    return () => window.clearInterval(timer);
  }, [upcomingEvents.length]);

  if (!content) return <State data={data} error={error} />;
  const primaryAction = content.primaryAction;
  const secondaryAction = content.secondaryAction;
  const communityAction = content.communityAction;

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> {content.eyebrow}
          </span>
          <State data={data} error={error}>
            <h1>{home?.title || 'Play. Learn. Grow.'}</h1>
            <p>{content.heroDescription}</p>
          </State>
          <div className="actions">
            <Link className="button gold" to={primaryAction.href}>
              {primaryAction.label} <ArrowUpRight size={18} />
            </Link>
            <Link className="button outline" to={secondaryAction.href}>
              {secondaryAction.label} <MoveRight size={18} />
            </Link>
          </div>
          <div className="hero-foot">
            {content.heroFoot.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-slider" aria-label="GVK sports highlights">
            {heroSlides.map((slide, index) => (
              <img
                key={`${slide.image}-${index}`}
                className={index === heroSlide ? 'active' : ''}
                src={slide.image}
                alt={index === 0 ? content.heroImageAlt : slide.label}
              />
            ))}
            <div className="hero-slider-caption">
              <span>{heroSlides[heroSlide]?.label}</span>
              <strong>{heroSlides[heroSlide]?.standard}</strong>
            </div>
            <div className="hero-slider-dots">
              {heroSlides.map((slide, index) => (
                <button key={`${slide.label}-dot`} className={index === heroSlide ? 'active' : ''} onClick={() => setHeroSlide(index)} aria-label={`Show highlight ${index + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Metrics Bar */}
      <section className="section" style={{ paddingTop: '10px', paddingBottom: '30px' }}>
        <div className="metrics-bar">
          {content.metrics.map((metric) => (
            <div className="metric-box" key={metric.label}>
              <div className="metric-number">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      {featuredEvent && (
        <section className="section home-event-section">
          <div className="home-event-feature">
            <div className="home-event-media" style={{ backgroundImage: `url(${featuredEvent.image})` }}>
              <span className="badge">Next on the arena calendar</span>
            </div>
            <div className="home-event-copy">
              <span className="eyebrow">UPCOMING EVENT</span>
              <h2>{featuredEvent.title}</h2>
              <p>{featuredEvent.description}</p>
              <div className="event-meta">{featuredEvent.sport} · {new Date(featuredEvent.start).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {featuredEvent.location}</div>
              <Link className="button gold" to="/events">See all events <ArrowUpRight size={17} /></Link>
              {upcomingEvents.length > 1 && <div className="event-slider-controls">
                <button type="button" onClick={() => setEventSlide((current) => (current - 1 + upcomingEvents.length) % upcomingEvents.length)} aria-label="Previous event">←</button>
                <span>{eventSlide + 1} / {upcomingEvents.length}</span>
                <button type="button" onClick={() => setEventSlide((current) => (current + 1) % upcomingEvents.length)} aria-label="Next event">→</button>
              </div>}
            </div>
          </div>
        </section>
      )}

      {/* Two Sports Cards */}
      <section className="section">
        <div className="section-title">
          <div>
            <span className="eyebrow">{content.sportsEyebrow}</span>
            <h2>{content.sportsTitle.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</h2>
          </div>
          <p>{content.sportsDescription}</p>
        </div>

        <div className="sport-grid">
          {content.sports.map((sport) => (
            <Link className="sport-card" to={sport.href} key={sport.title}>
              {sport.image && <div className="sport-card-media" style={{ backgroundImage: `url(${sport.image})` }} aria-hidden="true" />}
              <span className="sport-number">{sport.number}</span>
              <h3>{sport.title}</h3>
              <p>{sport.description}</p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {sport.badges.map((badge) => <span className="badge" key={badge}>{badge}</span>)}
              </div>
              <span className="round-arrow"><ArrowUpRight /></span>
            </Link>
          ))}
        </div>

        {/* Interactive Animated Assessment Widget */}
        <TrainingAssessmentWidget />
      </section>

      {/* Community Engagement */}
      <section className="community section">
        <div className="section-title">
          <div>
            <span className="eyebrow">{content.communityEyebrow}</span>
            <h2>{content.communityTitle}</h2>
          </div>
          <Link to={communityAction.href} className="button outline">
            {communityAction.label} <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="grid three">
          {content.communities.map((community) => {
            const Icon = iconMap[community.icon] || Users;
            return <article key={community.title} className="community-card">
              {community.image && <div className="community-card-media" style={{ backgroundImage: `url(${community.image})` }} aria-hidden="true" />}
              <div className="community-card-content">
                <Icon size={32} />
                <h3>{community.title}</h3>
                <p>{community.description}</p>
                <Link to={'/contact?interest=' + encodeURIComponent(community.title)}>
                  Enquire for your group <MoveRight size={16} />
                </Link>
              </div>
            </article>;
          })}
        </div>
      </section>
    </>
  );
}
