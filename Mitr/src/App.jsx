import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard  from './pages/UserDashboard';

// ── Auth Context ──────────────────────────────────────────────────────────────
export const AuthContext = React.createContext(null);

function ProtectedRoute({ children, requireAdmin = false }) {
  const ctx = React.useContext(AuthContext);
  if (!ctx.user) return <Navigate to="/login" replace />;
  if (requireAdmin && ctx.user.role !== 'admin')  return <Navigate to="/user-dashboard" replace />;
  if (!requireAdmin && ctx.user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
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
    // Clear per-user cached progress on logout
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
        <Router>
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/support" element={<SupportPage />} />

                {/* Auth pages — redirect away if already logged in */}
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
