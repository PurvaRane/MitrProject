import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Award, Calendar, HeartHandshake, User } from 'lucide-react';
import { AuthContext } from '../App';
import './BottomNav.css';

export default function BottomNav() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const currentPath = location.pathname;

  const ADMIN_ROLES = ['admin', 'master_admin', 'sub_admin'];
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const homePath = isAdmin
    ? '/admin-dashboard'
    : user?.role === 'faculty'
    ? '/faculty-dashboard'
    : user
    ? '/user-dashboard'
    : '/';

  const isHomeActive = currentPath === '/' ||
    currentPath === '/user-dashboard' ||
    currentPath === '/faculty-dashboard' ||
    currentPath === '/admin-dashboard';

  const isChallengesActive = currentPath === '/challenge';
  const isEventsActive = currentPath === '/events';
  const isSupportActive = currentPath === '/support';
  const isProfileActive = currentPath === '/profile' || currentPath === '/personal-growth';

  // Don't show bottom nav for admins (they use sidebar/desktop nav)
  if (isAdmin) return null;

  const navItems = [
    {
      to: homePath,
      label: 'Home',
      icon: Home,
      isActive: isHomeActive,
    },
    {
      to: '/challenge',
      label: 'Challenges',
      icon: Award,
      isActive: isChallengesActive,
    },
    {
      to: '/events',
      label: 'Events',
      icon: Calendar,
      isActive: isEventsActive,
    },
    {
      to: '/support',
      label: 'Support',
      icon: HeartHandshake,
      isActive: isSupportActive,
    },
    {
      to: user ? '/personal-growth' : '/login',
      label: user ? 'Growth' : 'Login',
      icon: User,
      isActive: isProfileActive || (!user && currentPath === '/login'),
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="mobile-bottom-nav__inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`mobile-bottom-nav__item ${item.isActive ? 'active' : ''}`}
              aria-current={item.isActive ? 'page' : undefined}
            >
              <div className="mobile-bottom-nav__icon-wrap">
                <Icon size={20} strokeWidth={item.isActive ? 2.5 : 1.75} />
                {item.isActive && <span className="mobile-bottom-nav__active-indicator" />}
              </div>
              <span className="mobile-bottom-nav__label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
