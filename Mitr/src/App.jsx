import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import './App.css';

import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage       from './pages/HomePage';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import EventsPage     from './pages/EventsPage';
import ChallengePage  from './pages/ChallengePage';
import ReflectionPage from './pages/ReflectionPage';
import SupportPage    from './pages/SupportPage';
import BookAppointment from './pages/BookAppointment';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard  from './pages/UserDashboard';

// ── Auth Context ──────────────────────────────────────────────────────────────
export const AuthContext = React.createContext(null);

/**
 * ScrollToTop component ensures that every page load starts from the top.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Makes links shared before the hash-routing migration continue to work whenever
// the host serves index.html for them (for example, through the Vercel rewrite).
function LegacyPathRedirect() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (!hash && pathname !== '/') {
      window.location.replace(`${window.location.origin}/#${pathname}${search}`);
    }
  }, []);
  return null;
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const ctx = React.useContext(AuthContext);
  
  // If no user is found in context, redirect to login
  if (!ctx.user) return <Navigate to="/login" replace />;
  
  // Role-based access control
  if (requireAdmin && ctx.user.role !== 'admin') {
    return <Navigate to="/user-dashboard" replace />;
  }
  
  // Note: We allow admins to view student pages if needed, 
  // but usually we redirect them to their own dashboard.
  // The user requested NO redirect to dashboard on refresh.
  // So we only redirect if they are trying to access a page they CLEARLY shouldn't.
  if (!requireAdmin && ctx.user.role === 'admin' && !children.type.name?.includes('Dashboard')) {
    // Admins can stay on student pages for viewing purposes, 
    // or we can keep the redirect if it's strictly enforced.
    // For now, let's keep it but ensure it doesn't trigger unexpectedly.
  }

  return children;
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mitr_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('mitr_user', JSON.stringify(userData));
    if (token) localStorage.setItem('mitr_token', token);
  };

  const logout = () => {
    localStorage.removeItem('mitr_user');
    localStorage.removeItem('mitr_token');
    localStorage.removeItem('mitr_challenge_progress');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser(prev => {
      const next = { ...prev, ...data };
      localStorage.setItem('mitr_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <AppProvider>
        {/* Hash routing keeps every client route refresh-safe on static hosts too.
            Existing Vercel SPA rewrites remain in place for legacy direct links. */}
        <Router>
          <ScrollToTop />
          <LegacyPathRedirect />
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/support" element={<SupportPage />} />

                {/* Auth pages — redirect away ONLY if already logged in and visiting login/register */}
                <Route
                  path="/login"
                  element={
                    user
                      ? <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />
                      : <LoginPage />
                  }
                />
                <Route
                  path="/register"
                  element={
                    user
                      ? <Navigate to="/user-dashboard" replace />
                      : <RegisterPage />
                  }
                />

                {/* User routes */}
                <Route path="/user-dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/events"         element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
                <Route path="/challenge"      element={<ProtectedRoute><ChallengePage /></ProtectedRoute>} />
                <Route path="/reflect"        element={<ProtectedRoute><ReflectionPage /></ProtectedRoute>} />
                <Route path="/book-appointment" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/admin-dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AppProvider>
    </AuthContext.Provider>
  );
}

export default App;
