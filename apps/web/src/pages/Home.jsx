import { Link } from 'react-router-dom';
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
  const home = data?.find((p) => p.slug === 'home');
  const content = home?.config;

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
          <img src={content.heroImage} alt={content.heroImageAlt} />
          <div className="art-label">
            <span>{content.heroLabel}</span>
            <strong>{content.heroStandard}</strong>
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
              <Icon size={32} />
              <h3>{community.title}</h3>
              <p>{community.description}</p>
              <Link to={'/contact?interest=' + encodeURIComponent(community.title)}>
                Enquire for your group <MoveRight size={16} />
              </Link>
            </article>;
          })}
        </div>
      </section>
    </>
  );
}
