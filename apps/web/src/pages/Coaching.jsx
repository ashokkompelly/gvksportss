import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Heading,
  useData,
  State,
  Empty,
  Notice,
  Action,
} from '../components/ui';
import { api, date } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  Zap,
  Video,
  Award,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  Layers,
  Activity,
} from 'lucide-react';

export default function Coaching() {
  const [params, setParams] = useSearchParams();
  const sport = params.get('sport') || 'All';
  const programs = useData('/catalog/programs');
  const slots = useData('/catalog/slots');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);

  async function book(id) {
    if (!user) return navigate('/login');
    try {
      await api('/member/bookings', { method: 'POST', body: { id } });
      setMessage('Your place is booked successfully! View your session in My GVK.');
      slots.reload();
    } catch (e) {
      setMessage(e.message);
    }
  }

  return (
    <section className="section">
      <Heading
        eyebrow="COACHING AT GVK"
        title="Championship Mentoring. High-Performance Facilities."
      >
        Choose your sport, master technical fundamentals, and leverage cutting-edge sports science
        and digital platforms.
      </Heading>

      {/* Sport Selector Filter */}
      <div className="filters" aria-label="Filter by sport">
        {['All', 'Badminton', 'Chess'].map((s) => (
          <button
            key={s}
            aria-pressed={sport === s}
            className={sport === s ? 'selected' : ''}
            onClick={() => setParams(s === 'All' ? {} : { sport: s })}
          >
            {s === 'All' ? 'All Coaching' : s === 'Badminton' ? '🏸 Badminton Academy' : '♟️ Chess & Chesslang'}
          </button>
        ))}
      </div>

      {/* BADMINTON HIGH-STANDARD ELITE FEATURES (shown when All or Badminton selected) */}
      {(sport === 'All' || sport === 'Badminton') && (
        <div style={{ marginBottom: '48px' }}>
          <div className="section-title">
            <div>
              <span className="eyebrow">
                <Flame size={14} /> HIGH-PERFORMANCE BADMINTON STANDARDS
              </span>
              <h2>Professional Court Training</h2>
            </div>
            <p>
              Engineered for competitive players with Olympic-specification infrastructure and
              sports biomechanics.
            </p>
          </div>

          <div className="feature-badge-grid">
            <div className="feature-box">
              <div className="feature-box-icon">
                <ShieldCheck size={24} />
              </div>
              <h4>8 Olympic-Grade BWF Courts</h4>
              <p>
                Multi-layer shock absorbing synthetic mat courts engineered for optimum grip, joint
                cushioning, and zero-glare 800-lux tournament LED illumination.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-box-icon">
                <Video size={24} />
              </div>
              <h4>Biomechanical Video Smash Analysis</h4>
              <p>
                High-speed 360-degree cameras capturing stroke angles, arm speed, and jump smash
                mechanics with frame-by-frame coach commentary.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-box-icon">
                <Zap size={24} />
              </div>
              <h4>Smash Speed Radar Tracking</h4>
              <p>
                Precision radar measuring racket head velocity and shuttlecock exit speeds up to
                400+ km/h to quantify stroke power improvement over time.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-box-icon">
                <Activity size={24} />
              </div>
              <h4>Multi-Shuttle Footwork Drills</h4>
              <p>
                Algorithmic 6-corner agility feeding, cognitive reaction timing lights, and endurance
                intervals tailored for high-tempo rally endurance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CHESS COACHING WITH CHESSLANG PLATFORM HIGHLIGHT (shown when All or Chess selected) */}
      {(sport === 'All' || sport === 'Chess') && (
        <div style={{ marginBottom: '48px' }}>
          <div className="section-title">
            <div>
              <span className="eyebrow">
                <Award size={14} /> CHESS COACHING & CHESSLANG PLATFORM
              </span>
              <h2>Chess Coaching Featuring the Chesslang Platform</h2>
            </div>
            <p>
              Integrated digital chess mentoring combining FIDE-certified master trainers with the
              Chesslang coaching platform for interactive boards, tactical drills, and personalized study.
            </p>
          </div>

          <div className="feature-badge-grid">
            <div className="feature-box">
              <div className="feature-box-icon">
                <Sparkles size={24} />
              </div>
              <h4>Interactive Chesslang Digital Boards</h4>
              <p>
                Live virtual boards with engine evaluations, visual annotations, and real-time mentor
                analysis during classroom and one-on-one sessions.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-box-icon">
                <CheckCircle2 size={24} />
              </div>
              <h4>Personalized Puzzle Homework</h4>
              <p>
                Curated tactical homework drills assigned weekly on the platform by coaches based on each
                student's game weaknesses and rating progression.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-box-icon">
                <Layers size={24} />
              </div>
              <h4>Comprehensive Game Archives</h4>
              <p>
                Every practice match is recorded in the platform database for deep post-game
                debriefs, blunder detection, and opening repertoire preparation.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-box-icon">
                <Award size={24} />
              </div>
              <h4>Weekly Academy Blitz & Rapid Arenas</h4>
              <p>
                Compete against academy peers in regular Swiss and arena tournaments with official pairings
                and automated rating progression.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Program Tiers from Database */}
      <div className="section-title spaced">
        <div>
          <span className="eyebrow">CURRICULUM TIERS</span>
          <h2>Structured Coaching Programs</h2>
        </div>
        <Link to="/contact" className="light-link">
          Request a Free Assessment Session →
        </Link>
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
                <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--gold)' }}>
                  Mode: {p.mode}
                </div>
                <div className="card-bottom">
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Batches: Morning & Evening</span>
                  <Link
                    to={`/contact?interest=${encodeURIComponent(p.title)}`}
                    className="button small outline"
                  >
                    Enquire Batch
                  </Link>
                </div>
              </article>
            ))}
        </div>
      </State>

      {/* Bookable Sessions Calendar */}
      <div className="section-title spaced">
        <div>
          <span className="eyebrow">UPCOMING SESSIONS</span>
          <h2>Book an Open Coaching Slot</h2>
        </div>
        <Link to="/account" className="light-link">My Active Bookings →</Link>
      </div>

      <Notice message={message} />

      <State {...slots}>
        {!slots.data?.filter(
          (s) => (sport === 'All' || s.sport === sport) && new Date(s.start) > new Date(),
        ).length && (
          <Empty>
            Current batch slots are being finalized for the upcoming week.
            <br />
            <Link to="/contact">Speak with our academy manager to reserve a spot →</Link>
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
                <p style={{ margin: '8px 0 14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                    <Calendar size={14} color="var(--gold)" /> {date(s.start)}
                  </span>
                  <br />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', marginTop: '4px' }}>
                    <MapPin size={14} color="var(--gold)" /> {s.location}
                  </span>
                </p>
                <div className="card-bottom">
                  <span>{s.remaining} place{s.remaining === 1 ? '' : 's'} available</span>
                  <Action disabled={s.remaining < 1} onClick={() => book(s.id)}>
                    {s.remaining < 1 ? 'Batch Full' : 'Book Session'}
                  </Action>
                </div>
              </article>
            ))}
        </div>
      </State>
    </section>
  );
}
