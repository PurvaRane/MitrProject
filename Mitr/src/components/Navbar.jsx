import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import './Navbar.css';

const publicLinks = [
  { to: '/',        label: 'Home'    },
  { to: '/support', label: 'Support' },
];

const studentLinks = [
  { to: '/user-dashboard', label: 'Dashboard' },
  { to: '/events',         label: 'Events'    },
  { to: '/challenge',      label: 'Challenge' },
  { to: '/reflect',        label: 'Journal'   },
  { to: '/support',        label: 'Support'   },
];

const adminLinks = [
  { to: '/admin-dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const links = user?.role === 'admin' ? adminLinks : user ? studentLinks : publicLinks;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Logo */}
        <Link
          to={user?.role === 'admin' ? '/admin-dashboard' : user ? '/user-dashboard' : '/'}
          className="navbar__logo"
        >
          <div className="navbar__logo-mark" />
          <div className="navbar__logo-text">
            <span className="navbar__logo-name">COEP मित्र</span>
            <span className="navbar__logo-sub">
              {user?.role === 'admin' ? 'Admin Panel' : 'Wellness Centre'}
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="navbar__links" aria-label="Main navigation">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`navbar__link ${location.pathname === to ? 'navbar__link--active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="navbar__actions">
          {user ? (
            <div className="navbar__user">
              <span className="navbar__user-greeting">
                {user.role === 'admin' ? 'Admin' : `${user.name || 'Student'}`}
              </span>
              <button className="btn btn-secondary btn-sm" id="navbar-logout-btn" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <Link to="/register" className="btn btn-secondary btn-sm">Register</Link>
              <Link to="/login" id="navbar-login-btn" className="btn btn-primary btn-sm">Login</Link>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`navbar__hamburger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`navbar__drawer ${menuOpen ? 'navbar__drawer--open' : ''}`}>
        {links.map(({ to, label }) => (
          <Link key={to} to={to} className="navbar__drawer-link">{label}</Link>
        ))}
        <div className="navbar__drawer-actions">
          {user ? (
            <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%' }}>
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Login to Portal
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ justifyContent: 'center', marginTop: 'var(--space-sm)' }}>
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
