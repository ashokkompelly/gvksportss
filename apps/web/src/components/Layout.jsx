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
import { Fragment, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from './ui';

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
  const [scrolled, setScrolled] = useState(false);
  const { data: pages } = useData('/catalog/pages');
  const footer = pages?.find((page) => page.slug === 'footer')?.config;
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 24);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <>
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="brand" aria-label="GVK Sportss Home">
          <img
            src="/logo.jpg"
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

      {footer && <footer>
        <div className="footer-top">
          {/* Brand Col */}
          <div className="footer-brand">
            <Link to="/" className="brand">
              <img
                src="/logo.jpg"
                alt="GVK Sportss Logo"
                className="brand-logo-img"
                style={{ height: '48px', width: '48px' }}
              />
              <div className="brand-text">
                <strong style={{ fontSize: '20px' }}>{footer.brandName}</strong>
                <small>{footer.brandTagline}</small>
              </div>
            </Link>
            <p>
              {footer.brandDescription}
            </p>
            <a
              href={`https://wa.me/${footer.whatsappNumber}?text=${encodeURIComponent(footer.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-whatsapp-btn"
            >
              <MessageSquare size={16} /> {footer.whatsappLabel}
            </a>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>{footer.quickLinksTitle}</h4>
            <ul className="footer-links">
              {footer.quickLinks.map((link) => <li key={link.label}><Link to={link.href}>{link.label}</Link></li>)}
            </ul>
          </div>

          {/* Training Programs */}
          <div className="footer-col">
            <h4>{footer.programsTitle}</h4>
            <ul className="footer-links">
              {footer.programs.map((link) => <li key={link.label}><Link to={link.href}>{link.label}</Link></li>)}
            </ul>
          </div>

          {/* Contact Info Col */}
          <div className="footer-col">
            <h4>{footer.contactTitle}</h4>
            <div className="contact-item">
              <PhoneCall size={16} />
              <div>
                {footer.phones.map((phone, index) => <span key={phone}>{index ? ' / ' : ''}<a href={`tel:${phone.replace(/\D/g, '')}`}>{phone}</a></span>)}
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{footer.contactName}</div>
              </div>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <div>
                {footer.emails.map((email, index) => <span key={email}>{index ? <><br /></> : null}<a href={`mailto:${email}`}>{email}</a></span>)}
              </div>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <div>
                {footer.address.map((line) => <Fragment key={line}>{line}<br /></Fragment>)}
              </div>
            </div>
            <div className="contact-item">
              <Clock size={16} />
              <div>
                {footer.hours.map((line) => <Fragment key={line}>{line}<br /></Fragment>)}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} {footer.copyright}</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {footer.bottomLinks.map((link) => <Link key={link.label} to={link.href}>{link.label}</Link>)}
          </div>
        </div>
      </footer>}

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
