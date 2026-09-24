import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  UserRound,
  ArrowUpRight,
  GraduationCap,
  PhoneCall,
  Mail,
  Clock,
  MessageSquare,
  Users,
  Image,
  Trophy,
  Instagram,
} from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from './ui';
import SiteNavLink from './SiteNavLink';
import { pageDefaults, mergeContent, visibleItems } from '../../../../shared/siteContent';

const navIcons = {
  home: Home,
  calendar: CalendarDays,
  graduation: GraduationCap,
  phone: PhoneCall,
  users: Users,
  image: Image,
  trophy: Trophy,
  user: UserRound,
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { data: pages } = useData('/catalog/pages');
  const footer = pages?.find((page) => page.slug === 'footer')?.config;
  const location = useLocation();
  const headerPage = pages?.find((page) => page.slug === 'header');
  const header = headerPage
    ? mergeContent(pageDefaults.header.config, headerPage.config)
    : pages === null
      ? pageDefaults.header.config
      : null;
  const brand = header?.brand;
  const account = header?.account;
  const menus = header?.navigation.enabled
    ? visibleItems(header.navigation.items).filter((item) => item.href && item.label)
    : [];
  const desktopMenus = menus.filter((item) => item.desktop);
  const mobileMenus = menus.filter((item) => item.mobile);
  const signedInAction = user?.role === 'admin' ? account?.adminAction : account?.memberAction;
  const mobileAccount = user ? signedInAction : account?.mobileGuestAction;

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
      {header && (
        <header className={`header managed-header${scrolled ? ' scrolled' : ''}`}>
          <SiteNavLink
            href={brand.href}
            newTab={brand.newTab}
            className="brand"
            aria-label={brand.name || brand.alt}
          >
            {brand.showLogo && brand.image && (
              <img
                key={brand.image}
                src={brand.image}
                alt={brand.alt}
                className="brand-logo-img"
                onError={(event) => {
                  event.currentTarget.style.visibility = 'hidden';
                }}
              />
            )}
            {(brand.showName || brand.showTagline) && (
              <div className="brand-text">
                {brand.showName && <strong>{brand.name}</strong>}
                {brand.showTagline && <small>{brand.tagline}</small>}
              </div>
            )}
          </SiteNavLink>
          {desktopMenus.length > 0 && (
            <nav className="desktop-nav" aria-label="Main navigation">
              {desktopMenus.map((item) => (
                <SiteNavLink
                  key={item.id}
                  href={item.href}
                  newTab={item.newTab}
                  activeClassName="active"
                >
                  {item.label}
                </SiteNavLink>
              ))}
            </nav>
          )}
          {account.desktopEnabled && (
            <div className="header-actions">
              {user ? (
                <>
                  <SiteNavLink
                    href={signedInAction.href}
                    newTab={signedInAction.newTab}
                    className="account"
                  >
                    <UserRound size={16} />
                    <span>
                      {account.showMemberName ? user.name.split(' ')[0] : signedInAction.label}
                    </span>
                  </SiteNavLink>
                  <button
                    className="text-button"
                    onClick={() => logout().catch((error) => setError(error.message))}
                  >
                    {account.logoutLabel}
                  </button>
                </>
              ) : (
                <SiteNavLink
                  href={account.guestAction.href}
                  newTab={account.guestAction.newTab}
                  className="button small"
                >
                  {account.guestAction.label}
                  <ArrowUpRight size={15} />
                </SiteNavLink>
              )}
            </div>
          )}
        </header>
      )}

      {error && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <p className="notice error" role="alert">
            {error}
          </p>
        </div>
      )}

      <main>
        <Outlet />
      </main>

      {footer && (
        <footer>
          <div className="footer-top">
            {/* Brand Col */}
            <div className="footer-brand">
              <Link to="/" className="brand">
                <img
                  src={brand?.image || pageDefaults.header.config.brand.image}
                  alt={brand?.alt || footer.brandName}
                  className="brand-logo-img"
                  style={{ height: '48px', width: '48px' }}
                />
                <div className="brand-text">
                  <strong style={{ fontSize: '20px' }}>{footer.brandName}</strong>
                  <small>{footer.brandTagline}</small>
                </div>
              </Link>
              <p>{footer.brandDescription}</p>
              {footer.instagramEnabled && footer.instagramHandle && (
                <a
                  className="footer-instagram-link"
                  href={
                    'https://www.instagram.com/' +
                    encodeURIComponent(footer.instagramHandle.replace(/^@/, '').trim()) +
                    '/'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={25} aria-hidden="true" />
                  <span>
                    <small>{footer.instagramLabel}</small>
                    <strong>@{footer.instagramHandle.replace(/^@/, '').trim()}</strong>
                  </span>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </a>
              )}
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
                {footer.quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Training Programs */}
            <div className="footer-col">
              <h4>{footer.programsTitle}</h4>
              <ul className="footer-links">
                {footer.programs.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info Col */}
            <div className="footer-col">
              <h4>{footer.contactTitle}</h4>
              <div className="contact-item">
                <PhoneCall size={16} />
                <div>
                  {footer.phones.map((phone, index) => (
                    <span key={phone}>
                      {index ? ' / ' : ''}
                      <a href={`tel:${phone.replace(/\D/g, '')}`}>{phone}</a>
                    </span>
                  ))}
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {footer.contactName}
                  </div>
                </div>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <div>
                  {footer.emails.map((email, index) => (
                    <span key={email}>
                      {index ? (
                        <>
                          <br />
                        </>
                      ) : null}
                      <a href={`mailto:${email}`}>{email}</a>
                    </span>
                  ))}
                </div>
              </div>
              <div className="contact-item">
                <Clock size={16} />
                <div>
                  {footer.hours.map((line) => (
                    <Fragment key={line}>
                      {line}
                      <br />
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              © {new Date().getFullYear()} {footer.copyright}
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              {footer.bottomLinks
                .filter((link) => !/directions|location|address/i.test(link.label))
                .map((link) => (
                  <Link key={link.label} to={link.href}>
                    {link.label}
                  </Link>
                ))}
            </div>
          </div>
        </footer>
      )}

      {header && (mobileMenus.length > 0 || (account.mobileEnabled && mobileAccount?.href)) && (
        <nav className="bottom-nav managed-bottom-nav" aria-label="Mobile navigation">
          {mobileMenus.map((item) => {
            const Icon = navIcons[item.icon] || ArrowUpRight;
            return (
              <SiteNavLink
                key={item.id}
                href={item.href}
                newTab={item.newTab}
                className="bottom-nav-item"
                activeClassName="active"
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </SiteNavLink>
            );
          })}
          {account.mobileEnabled && mobileAccount?.href && (
            <SiteNavLink
              href={mobileAccount.href}
              newTab={mobileAccount.newTab}
              className="bottom-nav-item"
              activeClassName="active"
            >
              <UserRound size={22} />
              <span>{mobileAccount.label}</span>
            </SiteNavLink>
          )}
        </nav>
      )}
    </>
  );
}
