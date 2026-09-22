import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Home, CalendarDays, UserRound, Menu, X, ArrowUpRight, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
const links = ['Home', 'About', 'Coaching', 'Events', 'Gallery', 'Contact'];
export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false),
    [error, setError] = useState('');
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          <strong>
            GVK<span>↗</span>
          </strong>
          <small>
            SPORTSS
            <br />
            PLAY · LEARN · GROW
          </small>
        </Link>
        <nav className={'desktop-nav ' + (open ? 'open' : '')} aria-label="Main navigation">
          {links.map((l) => (
            <NavLink key={l} to={l === 'Home' ? '/' : '/' + l.toLowerCase()}>
              {l}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link className="account" to={user.role === 'admin' ? '/admin' : '/account'}>
                <UserRound size={18} />
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
              Member login <ArrowUpRight size={16} />
            </Link>
          )}
          <button
            aria-label="Toggle navigation"
            aria-expanded={open}
            className="menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {error && <p role="alert">{error}</p>}
      <main>
        <Outlet />
      </main>
      <footer>
        <Link className="brand" to="/">
          <strong>
            GVK<span>↗</span>
          </strong>
          <small>SPORTSS</small>
        </Link>
        <p>Chess. Badminton. Sports experiences.</p>
        <div>
          <Link to="/contact">Let’s talk</Link>
          <Link to="/admin">Admin portal</Link>
        </div>
        <small>© {new Date().getFullYear()} GVK Sportss</small>
      </footer>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          [Home, 'Home', '/'],
          [GraduationCap, 'Coaching', '/coaching'],
          [CalendarDays, 'Events', '/events'],
          [UserRound, 'My GVK', '/account'],
        ].map(([Icon, label, to]) => (
          <NavLink to={to} key={to}>
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
