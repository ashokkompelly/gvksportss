import { useSearchParams, Link } from 'react-router-dom';
import {
  Heading,
  useData,
  State,
} from '../components/ui';
import {
  Sparkles,
  Award,
  Flame,
} from 'lucide-react';

const disciplineShowcases = {
  Badminton: {
    eyebrow: 'HIGH-PERFORMANCE BADMINTON STANDARDS',
    title: 'Professional Court Training',
    description: 'Engineered for competitive players with Olympic-specification infrastructure and sports biomechanics.',
    icon: Flame,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85',
    benefits: ['Olympic-grade BWF courts', 'Video and speed analysis', 'Footwork, fitness, and match training'],
  },
  Chess: {
    eyebrow: 'CHESS COACHING & CHESSLANG PLATFORM',
    title: 'Chess Coaching Featuring the Chesslang Platform',
    description: 'Integrated digital chess mentoring combining FIDE-certified master trainers with interactive boards, tactical drills, and personalized study.',
    icon: Award,
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1200&q=85',
    benefits: ['Live Chesslang digital boards', 'Weekly puzzles and game review', 'Blitz, rapid, and tournament practice'],
  },
};

function DisciplineShowcase({ sport }) {
  const showcase = disciplineShowcases[sport];
  if (!showcase) return null;
  const SectionIcon = showcase.icon;
  return (
    <section className="discipline-showcase compact-showcase">
      <div className="compact-showcase-image" style={{ backgroundImage: `url(${showcase.image})` }} aria-hidden="true" />
      <div className="compact-showcase-content">
        <span className="eyebrow"><SectionIcon size={14} /> {showcase.eyebrow}</span>
        <h2>{showcase.title}</h2>
        <p>{showcase.description}</p>
        <ul className="benefit-list">
          {showcase.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
        </ul>
        <Link className="button outline small" to={`/contact?interest=${sport}`}>Ask about {sport}</Link>
      </div>
    </section>
  );
}

const programImages = {
  Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85',
  Chess: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1200&q=85',
};
export default function Coaching() {
  const [params, setParams] = useSearchParams();
  const sport = params.get('sport') || 'All';
  const programs = useData('/catalog/programs');
  const visiblePrograms = sport === 'All'
    ? ['Badminton', 'Chess'].flatMap((category) =>
        programs.data?.filter((program) => program.sport === category).slice(0, 2) || [],
      )
    : programs.data?.filter((program) => program.sport === sport).slice(0, 2) || [];

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

      {sport === 'All' ? (
        <div className="discipline-showcase-grid">
          <DisciplineShowcase sport="Badminton" />
          <DisciplineShowcase sport="Chess" />
        </div>
      ) : <DisciplineShowcase sport={sport} />}

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
          {visiblePrograms.map((p) => (
            <article key={p.id} className="card">
              <div
                className="program-media"
                style={{ backgroundImage: `url(${p.image || programImages[p.sport]})` }}
                aria-hidden="true"
              />
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

      {/* Session booking remains available through My GVK while this section is being refreshed. */}
    </section>
  );
}
