import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Heading, useData, State, Empty, Notice, Field } from '../components/ui';
import { api } from '../lib/api';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const mentors = [
  {
    name: 'Vamshi Krishna',
    role: 'Founder & Managing Director',
    category: 'Leadership',
    experience: '14+ Years Experience',
    domain: 'Elite Sports Infrastructure & High-Performance Arena Development',
    bio: 'Former state-level badminton player turned sports entrepreneur dedicated to creating Olympic-standard grassroots training facilities in Hyderabad.',
    certification: 'Sports Facility Director',
  },
  {
    name: 'Mohan',
    role: 'Badminton Operations Lead',
    category: 'Badminton',
    experience: '8+ Years Experience',
    domain: 'Olympic Court Management, Precision Electronic Racket Stringing',
    bio: 'Ensures tournament-grade court condition, LED lighting lux standards, shuttlecock temperature regulation, and precision stringing tension.',
    certification: 'Certified Badminton Operations Manager',
  },
 
  
  {
    name: 'Sunil',
    role: 'Creative & Media Director',
    category: 'Leadership',
    experience: '10+ Years Experience',
    domain: 'Sports Broadcast Media, Player Branding & Tournament Production',
    bio: 'Leads visual storytelling, live match broadcasts, tournament creative assets, and athlete sponsorship engagement.',
    certification: 'Media Production Specialist',
  },
  {
    name: 'Anup',
    role: 'Chess Operations Director',
    category: 'Chess',
    experience: '11+ Years Experience',
    domain: 'FIDE Rated Event Arbiter & Youth Talent Scouting',
    bio: 'Organizes national-level Swiss format tournaments, coordinates school chess circuits, and oversees digital pairings.',
    certification: 'FIDE National Arbiter (NA)',
  },
  {
    name: 'Ashok',
    role: 'Digital & Web Director',
    category: 'Leadership',
    experience: '12+ Years Experience',
    domain: 'Sports Tech Platforms, Live Tournament Scoring & Player Portals',
    bio: 'Architect of GVK digital platforms, player member booking workflows, tournament streaming setups, and analytics integrations.',
    certification: 'Sports Tech Systems Lead',
  }
];

export function ContentPage({ slug: fixed }) {
  const params = useParams();
  const slug = fixed || params.slug;
  const { data, error } = useData('/catalog/pages');
  const page = data?.find((p) => p.slug === slug);
  const [filter, setFilter] = useState('All');

  return (
    <section className="section">
      <State data={data} error={error}>
        {page ? (
          <>
            <Heading eyebrow="GVK SPORTSS" title={page.title} />
            <p className="prose">{page.body}</p>

            {slug === 'about' && (
              <div style={{ marginTop: '50px' }}>
                <div className="section-title">
                  <div>
                    <span className="eyebrow">
                      <Sparkles size={14} /> FACULTY & LEADERSHIP
                    </span>
                    <h2>The People Behind GVK Sportss</h2>
                  </div>
                  <p>
                    Every coach and director brings recognized credentials, decades of practical
                    competition experience, and dedicated domain expertise.
                  </p>
                </div>

                {/* Filter buttons for people categories */}
                <div className="filters" style={{ marginBottom: '24px' }}>
                  {['All', 'Badminton', 'Chess', 'Leadership'].map((cat) => (
                    <button
                      key={cat}
                      className={filter === cat ? 'selected' : ''}
                      onClick={() => setFilter(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid three">
                  {mentors
                    .filter((m) => filter === 'All' || m.category === filter)
                    .map((m) => (
                      <article className="coach-card" key={m.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="coach-exp-badge">
                            <Award size={13} /> {m.experience}
                          </span>
                          <span className="badge">{m.category}</span>
                        </div>

                        <h3 style={{ fontSize: '20px', margin: '4px 0 2px' }}>{m.name}</h3>
                        <div style={{ color: 'var(--gold-bright)', fontSize: '13px', fontWeight: '600' }}>
                          {m.role}
                        </div>

                        <div className="coach-domain-tag">
                          <strong>Domain:</strong> {m.domain}
                        </div>

                        <p style={{ fontSize: '13px', margin: '12px 0 0', flex: 1 }}>
                          {m.bio}
                        </p>

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
  const [params] = useSearchParams(),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);

  return (
    <section className="section">
      <Heading eyebrow="LET’S CONNECT" title="Start Your Sporting Journey with GVK">
        Speak with our coaching directors, book a facility tour, or plan an event for your school,
        community, or organization.
      </Heading>

      {/* SAMPLE CONTACT DETAILS SECTION */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '44px',
        }}
      >
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ color: 'var(--gold)', marginBottom: '12px' }}>
            <PhoneCall size={26} />
          </div>
          <h3 style={{ fontSize: '18px', margin: '0 0 6px' }}>Phone Numbers</h3>
          <p style={{ fontSize: '14px', margin: '0 0 8px' }}>Direct desk & coaching hotline</p>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
            <a href="tel:+919876543210">+91 98765 43210</a>
            <br />
            <a href="tel:+919123456789">+91 91234 56789</a>
          </div>
        </div>

        <div className="card" style={{ padding: '22px' }}>
          <div style={{ color: 'var(--gold)', marginBottom: '12px' }}>
            <Mail size={26} />
          </div>
          <h3 style={{ fontSize: '18px', margin: '0 0 6px' }}>Email Inquiries</h3>
          <p style={{ fontSize: '14px', margin: '0 0 8px' }}>Response within 24 hours</p>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
            <a href="mailto:info@gvksportss.com">info@gvksportss.com</a>
            <br />
            <a href="mailto:coaching@gvksportss.com">coaching@gvksportss.com</a>
          </div>
        </div>

        <div className="card" style={{ padding: '22px' }}>
          <div style={{ color: 'var(--gold)', marginBottom: '12px' }}>
            <MessageSquare size={26} />
          </div>
          <h3 style={{ fontSize: '18px', margin: '0 0 6px' }}>WhatsApp Instant</h3>
          <p style={{ fontSize: '14px', margin: '0 0 8px' }}>Quick batch enquiry & slots</p>
          <a
            href="https://wa.me/919876543210?text=Hi%20GVK%20Sportss,%20I%20would%20like%20to%20enquire%20about%20coaching%20slots."
            target="_blank"
            rel="noopener noreferrer"
            className="button small"
            style={{ marginTop: '6px' }}
          >
            Chat on WhatsApp ↗
          </a>
        </div>

        <div className="card" style={{ padding: '22px' }}>
          <div style={{ color: 'var(--gold)', marginBottom: '12px' }}>
            <Clock size={26} />
          </div>
          <h3 style={{ fontSize: '18px', margin: '0 0 6px' }}>Training Timings</h3>
          <p style={{ fontSize: '14px', margin: '0 0 6px' }}>Open all 7 days a week</p>
          <div style={{ fontSize: '14px', color: '#fff' }}>
            <strong>Monday – Sunday:</strong>
            <br />
            Morning: 6:00 AM – 11:00 AM
            <br />
            Evening: 4:00 PM – 10:00 PM
          </div>
        </div>
      </div>

      <div className="contact-grid">
        <div>
          <h2>Tell Us What You Have in Mind</h2>
          <p>
            Whether you want personal coaching, are reserving an Olympic badminton court, or want to
            bring our chess and badminton coaching programs to your school or corporate campus, our directors
            are ready to assist.
          </p>

          <div className="callout">
            <strong>Training Centers in Hyderabad:</strong>
            <div style={{ marginTop: '12px', fontSize: '13px', lineHeight: '1.7', color: 'var(--muted-light)' }}>
              📍 <strong>HQ Arena:</strong> Plot 42, Financial District, Near Wipro Circle, Gachibowli, Hyderabad 500032
              <br />
              📍 <strong>Jubilee Hills Hub:</strong> Road No. 36, Near Metro Station, Jubilee Hills, Hyderabad 500033
              <br />
              📍 <strong>Madhapur Center:</strong> Near Cyber Towers, Hitec City, Madhapur 500081
            </div>
          </div>
        </div>

        <form
          className="card form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            try {
              await api('/enquiries', {
                method: 'POST',
                body: Object.fromEntries(new FormData(form)),
              });
              setMessage('Thank you! Your enquiry has been received. Our coaching coordinator will reach out shortly.');
              form.reset();
            } catch (e) {
              setMessage(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3 style={{ margin: 0 }}>Send an Academy Message</h3>
          <Field label="Your full name" name="name" required maxLength={120} />
          <Field label="Email address" name="email" type="email" required />
          <Field label="Organization / School / Community (optional)" name="organization" maxLength={200} />
          <label className="field">
            How can we help?
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={3000}
              defaultValue={
                params.get('interest')
                  ? `I’m interested in GVK ${params.get('interest')} coaching & programs.`
                  : ''
              }
              placeholder="Tell us your sport preference (Badminton / Chess), level, age group, or specific questions..."
            />
          </label>
          <button className="button gold" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Academy Enquiry'}
          </button>
          <Notice message={message} />
        </form>
      </div>
    </section>
  );
}
