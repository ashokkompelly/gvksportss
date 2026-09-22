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

export default function Home() {
  const { data, error } = useData('/catalog/pages');
  const home = data?.find((p) => p.slug === 'home');

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> CHESS + BADMINTON • HYDERABAD
          </span>
          <State data={data} error={error}>
            <h1>{home?.title || 'Play. Learn. Grow.'}</h1>
            <p>
              Elevate your game with world-class coaching, Olympic-grade badminton courts, and
              interactive chess coaching powered by the Chesslang platform.
            </p>
          </State>
          <div className="actions">
            <Link className="button gold" to="/coaching">
              Explore Coaching Batches <ArrowUpRight size={18} />
            </Link>
            <Link className="button outline" to="/events">
              Tournaments & Events <MoveRight size={18} />
            </Link>
          </div>
          <div className="hero-foot">
            <span>01 / 8 BWF Synthetic Courts</span>
            <span>02 / Chesslang Platform Coaching</span>
            <span>03 / FIDE & BWF Certified Coaches</span>
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/logo.png"
            alt="GVK Sportss Gold and Black Emblem"
          />
          <div className="art-label">
            <span>THE GVK STANDARD</span>
            <strong>
              Discipline. Technique. Mastery.
            </strong>
          </div>
        </div>
      </section>

      {/* Quick Metrics Bar */}
      <section className="section" style={{ paddingTop: '10px', paddingBottom: '30px' }}>
        <div className="metrics-bar">
          <div className="metric-box">
            <div className="metric-number">8 Courts</div>
            <div className="metric-label">Olympic-Grade BWF Mats</div>
          </div>
          <div className="metric-box">
            <div className="metric-number">Chesslang</div>
            <div className="metric-label">Platform Coaching</div>
          </div>
          <div className="metric-box">
            <div className="metric-number">15+ Coaches</div>
            <div className="metric-label">BWF & FIDE Certified Mentors</div>
          </div>
          <div className="metric-box">
            <div className="metric-number">500+</div>
            <div className="metric-label">Active Academy Athletes</div>
          </div>
        </div>
      </section>

      {/* Two Sports Cards */}
      <section className="section">
        <div className="section-title">
          <div>
            <span className="eyebrow">CHOOSE YOUR DISCIPLINE</span>
            <h2>
              Precision on court.
              <br />Strategy on board.
            </h2>
          </div>
          <p>
            Whether smashing at 350+ km/h or outmaneuvering an opponent in a Sicilian defense, GVK
            provides championship-level mentoring.
          </p>
        </div>

        <div className="sport-grid">
          {/* Badminton Card */}
          <Link className="sport-card" to="/coaching?sport=Badminton">
            <span className="sport-number">01 / BADMINTON HIGH-PERFORMANCE</span>
            <h3>Badminton Academy</h3>
            <p>
              BWF Level 2 certified coaching, slow-motion biomechanics video smash analysis,
              radar speed tracking, and Olympic-spec synthetic shock-absorbing courts.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge">BWF Certified</span>
              <span className="badge">Video Analysis</span>
              <span className="badge">Smash Radar</span>
            </div>
            <span className="round-arrow">
              <ArrowUpRight />
            </span>
          </Link>

          {/* Chess Card with Chesslang Integrated */}
          <Link className="sport-card" to="/coaching?sport=Chess">
            <span className="sport-number">02 / CHESS COACHING</span>
            <h3>Chess Masterclass</h3>
            <p>
              Integrated with the <strong>Chesslang platform</strong> for digital coaching. FIDE-rated
              trainers, interactive live board sessions, tactical puzzle homework, and regular game debriefs.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge">Chesslang Platform Coaching</span>
              <span className="badge">FIDE Mentors</span>
              <span className="badge">Interactive Boards</span>
            </div>
            <span className="round-arrow">
              <ArrowUpRight />
            </span>
          </Link>
        </div>

        {/* Interactive Animated Assessment Widget */}
        <TrainingAssessmentWidget />
      </section>

      {/* Community Engagement */}
      <section className="community section">
        <div className="section-title">
          <div>
            <span className="eyebrow">SPORTS FOR EVERY COMMUNITY</span>
            <h2>Bring championship energy into play.</h2>
          </div>
          <Link to="/contact" className="button outline">
            Plan an Experience <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="grid three">
          {[
            [
              School,
              'Schools & Academies',
              'Curriculum-integrated badminton and chess coaching, inter-school tournaments, and youth scout camps.',
            ],
            [
              Users,
              'Gated Communities',
              'Resident leagues, weekend clinics, certified coaches on-site, and friendly multi-age championships.',
            ],
            [
              Building2,
              'Corporate Leagues',
              'Executive stress-relief wellness, corporate badminton cups, and workplace chess tournaments.',
            ],
          ].map(([Icon, title, text]) => (
            <article key={title} className="community-card">
              <Icon size={32} />
              <h3>{title}</h3>
              <p>{text}</p>
              <Link to={'/contact?interest=' + encodeURIComponent(title)}>
                Enquire for your group <MoveRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
