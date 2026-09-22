import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  UserRound,
  ArrowUpRight,
  GraduationCap,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const links = [
  { name: 'Home', to: '/' },
  { name: 'Coaching', to: '/coaching' },
  { name: 'Events', to: '/events' },
  { name: 'Trainers & Team', to: '/about' },
  { name: 'Gallery', to: '/gallery' },
  { name: 'Contact', to: '/contact' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <header className="header">
        <Link to="/" className="brand" aria-label="GVK Sportss Home">
          <img
            src="/logo.png"
            alt="GVK Sportss Logo"
            className="brand-logo-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="brand-text">
            <strong>GVK SPORTSS</strong>
            <small>PLAY · LEARN · GROW</small>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {l.name}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <Link className="account" to={user.role === 'admin' ? '/admin' : '/account'}>
                <UserRound size={16} />
                <span>{user.name.split(' ')[0]}</span>
              </Link>
              <button
                className="text-button"
                onClick={() => logout().catch((e) => setError(e.message))}
              >
                Log out
              </button>
            </>
          ) : (
            <Link className="button small" to="/login">
              Member Portal <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </header>

      {error && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <p className="notice error" role="alert">{error}</p>
        </div>
      )}

      <main>
        <Outlet />
      </main>

      {/* Comprehensive Sports Footer with Sample Contact Details */}
      <footer>
        <div className="footer-top">
          {/* Brand Col */}
          <div className="footer-brand">
            <Link to="/" className="brand">
              <img
                src="/logo.png"
                alt="GVK Sportss Logo"
                className="brand-logo-img"
                style={{ height: '48px', width: '48px' }}
              />
              <div className="brand-text">
                <strong style={{ fontSize: '20px' }}>GVK SPORTSS</strong>
                <small>PLAY · LEARN · GROW</small>
              </div>
            </Link>
            <p>
              Premier sports training academy specializing in professional badminton court coaching,
              official Chesslang digital masterclasses, and competitive sports championships.
            </p>
            <a
              href="https://wa.me/919876543210?text=Hi%20GVK%20Sportss,%20I%20would%20like%20to%20enquire%20about%20coaching%20sessions."
              target="_blank"
              rel="noopener noreferrer"
              className="footer-whatsapp-btn"
            >
              <MessageSquare size={16} /> WhatsApp Us Quick
            </a>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Academy Links</h4>
            <ul className="footer-links">
              <li><Link to="/coaching?sport=Badminton">Badminton Coaching</Link></li>
              <li><Link to="/coaching?sport=Chess">Chess Coaching</Link></li>
              <li><Link to="/events">Tournaments & Leagues</Link></li>
              <li><Link to="/about">Coaching Faculty & Mentors</Link></li>
              <li><Link to="/gallery">Moments & Highlights</Link></li>
              <li><Link to="/admin">Admin Staff Portal</Link></li>
            </ul>
          </div>

          {/* Training Programs */}
          <div className="footer-col">
            <h4>Programs</h4>
            <ul className="footer-links">
              <li><Link to="/coaching">Grassroots Youth (5-10 yrs)</Link></li>
              <li><Link to="/coaching">Elite Competitive Squad</Link></li>
              <li><Link to="/coaching">Adult High-Fitness Batches</Link></li>
              <li><Link to="/coaching?sport=Chess">Chess Coaching & Puzzles</Link></li>
              <li><Link to="/contact?interest=Schools">School & Corporate Leagues</Link></li>
            </ul>
          </div>

          {/* Contact Info Col */}
          <div className="footer-col">
            <h4>Contact Arena</h4>
            <div className="contact-item">
              <PhoneCall size={16} />
              <div>
                <a href="tel:+919876543210">+91 98765 43210</a> / <a href="tel:+919123456789">+91 91234 56789</a>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Reception & Coaching Desk</div>
              </div>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <div>
                <a href="mailto:info@gvksportss.com">info@gvksportss.com</a>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>coaching@gvksportss.com</div>
              </div>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <div>
                <strong>GVK Sportss Arena</strong><br />
                Plot 42, Financial District, Gachibowli,<br />
                Hyderabad, Telangana 500032
              </div>
            </div>
            <div className="contact-item">
              <Clock size={16} />
              <div>
                <strong>Operating Hours:</strong><br />
                Mon – Sun: 6:00 AM – 10:00 PM
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} GVK Sportss Academy. All rights reserved. Play. Learn. Grow.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/about">Our Team</Link>
            <Link to="/contact">Directions</Link>
            <Link to="/login">Member Login</Link>
          </div>
        </div>
      </footer>

      {/* Trending Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/coaching" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <GraduationCap size={22} />
          <span>Coaching</span>
        </NavLink>
        <NavLink to="/events" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <CalendarDays size={22} />
          <span>Events</span>
        </NavLink>
        <NavLink to="/contact" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <PhoneCall size={22} />
          <span>Contact</span>
        </NavLink>
        <NavLink to={user ? (user.role === 'admin' ? '/admin' : '/account') : '/account'} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <UserRound size={22} />
          <span>{user ? 'My GVK' : 'Login'}</span>
        </NavLink>
      </nav>
    </>
  );
}
