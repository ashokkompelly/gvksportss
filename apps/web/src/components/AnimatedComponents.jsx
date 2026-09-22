import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Award, Target, Flame, Activity, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Interactive animated skill assessment & arena preview component
 */
export function TrainingAssessmentWidget() {
  const [activeTab, setActiveTab] = useState('badminton');
  const [badmintonGoal, setBadmintonGoal] = useState('smash');
  const [chessElo, setChessElo] = useState('intermediate');

  return (
    <div
      style={{
        background: 'linear-gradient(155deg, #111714 0%, #080b09 100%)',
        border: '1px solid var(--gold-border)',
        borderRadius: '20px',
        padding: '32px',
        margin: '36px 0',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <span className="badge" style={{ marginBottom: '8px' }}>
            <Activity size={14} /> Interactive Performance Planner
          </span>
          <h3 style={{ margin: '4px 0 0', fontSize: '24px', color: '#fff' }}>
            Find Your Recommended Academy Path
          </h3>
        </div>

        {/* Tab Toggle with Motion Slider */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--line)',
            position: 'relative',
          }}
        >
          <button
            onClick={() => setActiveTab('badminton')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 0,
              background: activeTab === 'badminton' ? 'var(--gold-gradient)' : 'transparent',
              color: activeTab === 'badminton' ? '#070908' : 'var(--muted-light)',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🏸 Badminton
          </button>
          <button
            onClick={() => setActiveTab('chess')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 0,
              background: activeTab === 'chess' ? 'var(--gold-gradient)' : 'transparent',
              color: activeTab === 'chess' ? '#070908' : 'var(--muted-light)',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            ♟️ Chess Coaching
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'badminton' ? (
          <motion.div
            key="badminton"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}
          >
            <div>
              <label style={{ fontSize: '14px', color: 'var(--muted-light)', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                Select Your Key Focus Area:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { id: 'smash', title: 'Smash Velocity & Biomechanics', desc: 'Radar tracking, racket kinetic chain & jump mechanics' },
                  { id: 'footwork', title: '6-Corner Agility & Periodization', desc: 'High-tempo court coverage & deceptive net recovery' },
                  { id: 'matchplay', title: 'Tournament Singles & Doubles Strategy', desc: 'Flat exchanges, deception & pressure match simulation' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setBadmintonGoal(item.id)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: badmintonGoal === item.id ? '1px solid var(--gold)' : '1px solid var(--line)',
                      background: badmintonGoal === item.id ? 'rgba(239, 195, 94, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '15px', color: badmintonGoal === item.id ? 'var(--gold-light)' : '#fff' }}>
                        {item.title}
                      </strong>
                      {badmintonGoal === item.id && <Zap size={16} color="var(--gold)" />}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation Result */}
            <div
              style={{
                background: 'rgba(5, 8, 7, 0.75)',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid var(--gold-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="badge" style={{ marginBottom: '10px' }}>
                  Tailored Training Plan
                </span>
                <h4 style={{ fontSize: '20px', margin: '6px 0 10px', color: '#fff' }}>
                  {badmintonGoal === 'smash'
                    ? 'Smash Power & Biomechanics Clinic'
                    : badmintonGoal === 'footwork'
                    ? 'Agility & 6-Corner Footwork Batch'
                    : 'Elite Matchplay & Tournament Squad'}
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--muted-light)', margin: '0 0 16px', lineHeight: '1.6' }}>
                  {badmintonGoal === 'smash'
                    ? 'Includes slow-motion 360° video analysis, radar sensor speed testing, and rotator cuff stability exercises supervised by BWF Level 2 coaches.'
                    : badmintonGoal === 'footwork'
                    ? 'Focuses on reaction timing lights, multi-shuttle endurance feeding, and split-step recovery on Olympic BWF shock-absorbing mat courts.'
                    : 'Structured tactical sparring, video review of match tactics, and mental conditioning for state and national tournaments.'}
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <span className="badge">BWF Synthetic Courts</span>
                  <span className="badge">Video Analysis</span>
                  <span className="badge">1:4 Coach-Athlete Ratio</span>
                </div>
              </div>

              <Link
                to={`/contact?interest=Badminton-${badmintonGoal}`}
                className="button gold"
                style={{ width: '100%' }}
              >
                Reserve Free Assessment Slot <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chess"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}
          >
            <div>
              <label style={{ fontSize: '14px', color: 'var(--muted-light)', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                Select Your Playing Level:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { id: 'beginner', title: 'Pawn Foundations (0 - 1000 Elo)', desc: 'Piece motion, basic tactical motifs, and mating nets' },
                  { id: 'intermediate', title: 'Tactical Mastery (1000 - 1600 Elo)', desc: 'Opening repertoires, pawn structure strategy & Chesslang homework' },
                  { id: 'master', title: 'FIDE Grandmaster Prep (1600+ Elo)', desc: 'Deep calculation, psychological prep & International Master mentorship' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setChessElo(item.id)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: chessElo === item.id ? '1px solid var(--gold)' : '1px solid var(--line)',
                      background: chessElo === item.id ? 'rgba(239, 195, 94, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '15px', color: chessElo === item.id ? 'var(--gold-light)' : '#fff' }}>
                        {item.title}
                      </strong>
                      {chessElo === item.id && <Award size={16} color="var(--gold)" />}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chesslang Recommendation */}
            <div
              style={{
                background: 'rgba(5, 8, 7, 0.75)',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid var(--gold-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="badge" style={{ marginBottom: '10px' }}>
                  Official Chesslang Curriculum
                </span>
                <h4 style={{ fontSize: '20px', margin: '6px 0 10px', color: '#fff' }}>
                  {chessElo === 'beginner'
                    ? 'Chess Foundations & Tactical Puzzles'
                    : chessElo === 'intermediate'
                    ? 'Chesslang Intermediate Arena Batch'
                    : 'FIDE Rated Masterclass & Grandmaster Prep'}
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--muted-light)', margin: '0 0 16px', lineHeight: '1.6' }}>
                  Every student receives an active <strong>Chesslang Digital Campus account</strong> with
                  interactive live coach board, weekly homework tactical puzzles, and automated Elo tracking.
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <span className="badge">Chesslang Platform Coaching</span>
                  <span className="badge">FIDE Coaches</span>
                  <span className="badge">Weekly Blitz Arena</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  to="/coaching?sport=Chess"
                  className="button outline"
                  style={{ flex: 1, padding: '10px 12px', fontSize: '13px', textAlign: 'center' }}
                >
                  View Batches
                </Link>
                <Link
                  to={`/contact?interest=Chess-${chessElo}`}
                  className="button gold"
                  style={{ flex: 1.2, padding: '10px 12px', fontSize: '13px', textAlign: 'center' }}
                >
                  Enquire Batch <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
