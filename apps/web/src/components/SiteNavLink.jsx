import { NavLink } from 'react-router-dom';

// Keep internal links in the app and use normal anchors for external destinations.
export default function SiteNavLink({
  href,
  newTab = false,
  className,
  activeClassName,
  children,
  ...props
}) {
  if (!href) return null;
  const targetProps = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  if (!href.startsWith('/'))
    return (
      <a href={href} className={className} {...targetProps} {...props}>
        {children}
      </a>
    );
  return (
    <NavLink
      to={href}
      end={href === '/'}
      className={({ isActive }) =>
        [className, isActive ? activeClassName : ''].filter(Boolean).join(' ')
      }
      {...targetProps}
      {...props}
    >
      {children}
    </NavLink>
  );
}
