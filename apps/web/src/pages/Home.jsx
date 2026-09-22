import { Link } from 'react-router-dom';
import { ArrowUpRight, MoveRight, Trophy, Users, Building2, School } from 'lucide-react';
import { useData, State } from '../components/ui';
export default function Home() {
  const { data, error } = useData('/catalog/pages');
  const home = data?.find((p) => p.slug === 'home');
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">CHESS + BADMINTON • HYDERABAD</span>
          <State data={data} error={error}>
            <h1>{home?.title || 'Play. Learn. Grow.'}</h1>
            <p>{home?.body || 'Explore coaching and sports experiences with GVK Sportss.'}</p>
          </State>
          <div className="actions">
            <Link className="button gold" to="/coaching">
              Find your coaching <ArrowUpRight size={20} />
            </Link>
            <Link className="light-link" to="/events">
              Explore events <MoveRight size={18} />
            </Link>
          </div>
          <div className="hero-foot">
            <span>01 / ON THE COURT</span>
            <span>02 / ACROSS THE BOARD</span>
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/brand-launch.jpeg"
            alt="GVK supplied brand artwork featuring badminton and chess"
          />
          <div className="art-label">
            <span>THE GVK SPIRIT</span>
            <strong>
              Two sports.
              <br />
              Endless possibilities.
            </strong>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-title">
          <div>
            <span className="eyebrow">FIND YOUR GAME</span>
            <h2>
              A little practice.
              <br />A lasting difference.
            </h2>
          </div>
          <p>From your first rally to your next strategic move, make room for progress.</p>
        </div>
        <div className="sport-grid">
          <Link className="sport-card badminton" to="/coaching?sport=Badminton">
            <span className="sport-number">01 / BADMINTON</span>
            <h3>Move with purpose.</h3>
            <p>
              Technique, footwork and the confidence
              <br />
              to own your next rally.
            </p>
            <span className="round-arrow">
              <ArrowUpRight />
            </span>
          </Link>
          <Link className="sport-card chess" to="/coaching?sport=Chess">
            <span className="sport-number">02 / CHESS</span>
            <h3>Think a move ahead.</h3>
            <p>
              Build focus and turn good ideas
              <br />
              into stronger moves.
            </p>
            <span className="round-arrow">
              <ArrowUpRight />
            </span>
          </Link>
        </div>
      </section>
      <section className="community section">
        <div className="section-title">
          <div>
            <span className="eyebrow">SPORTS FOR EVERY COMMUNITY</span>
            <h2>Bring people into play.</h2>
          </div>
          <Link to="/contact" className="button outline">
            Plan an experience <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="grid three">
          {[
            [
              School,
              'Schools',
              'Coaching programs, inter-school events and a space for young talent.',
            ],
            [Users, 'Communities', 'Friendly tournaments and sports experiences closer to home.'],
            [
              Building2,
              'Corporates',
              'Team engagement, workplace leagues and wellness through sport.',
            ],
          ].map(([Icon, title, text]) => (
            <article key={title} className="community-card">
              <Icon size={28} />
              <h3>{title}</h3>
              <p>{text}</p>
              <Link to={'/contact?interest=' + title}>
                Enquire <MoveRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
