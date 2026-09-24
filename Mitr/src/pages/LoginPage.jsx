import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { authAPI } from '../api';
import './LoginPage.css';

export default function LoginPage() {
  const { login }  = useContext(AuthContext);
  const navigate   = useNavigate();

  const [tab,      setTab]      = useState('student'); // 'student' | 'faculty' | 'admin'
  const [form,     setForm]     = useState({ identifier: '', password: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const switchTab = (t) => {
    setTab(t);
    setForm({ identifier: '', password: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.identifier.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (tab === 'student' && !/^\d{9}$/.test(form.identifier.trim())) {
      setError('MIS ID must be exactly 9 digits.');
      return;
    }
    if (tab === 'faculty' && !/^\S+@\S+\.\S+$/.test(form.identifier.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (tab === 'admin') {
        data = await authAPI.loginAdmin(form.identifier.trim(), form.password);
      } else if (tab === 'faculty') {
        data = await authAPI.loginFaculty(form.identifier.trim(), form.password);
      } else {
        data = await authAPI.loginStudent(form.identifier.trim(), form.password);
      }
      login(data.user, data.token);

      if (data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (data.user.role === 'faculty') {
        navigate('/faculty-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } catch (err) {
      // Network error → no fallback, show clear message
      if (err instanceof TypeError) {
        setError('Cannot reach server. Please make sure the backend is running.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const quotes = [
    'Every day is a fresh start.',
    'You matter more than you know.',
    'Growth happens gently.',
    'Be kind to yourself today.',
  ];

  return (
    <div className="login-page">
      <div className="login-blob login-blob--1" />
      <div className="login-blob login-blob--2" />

      <div className="login-card glass animate-fade-in-up">
        <div className="login-card__bar" />

        <div className="login-card__header">
          <Link to="/" className="login-card__logo">COEP मित्र</Link>
          <h1 className="login-card__title">Welcome back</h1>
          <p className="login-card__subtitle">Your wellbeing matters. We're glad you're here.</p>
        </div>

        {/* Role tabs */}
        <div className="login-role-tabs">
          <button
            id="login-tab-student"
            className={`login-role-tab ${tab === 'student' ? 'active' : ''}`}
            onClick={() => switchTab('student')}
          >
            Student
          </button>
          <button
            id="login-tab-faculty"
            className={`login-role-tab ${tab === 'faculty' ? 'active' : ''}`}
            onClick={() => switchTab('faculty')}
          >
            Faculty
          </button>
          <button
            id="login-tab-admin"
            className={`login-role-tab ${tab === 'admin' ? 'active' : ''}`}
            onClick={() => switchTab('admin')}
          >
            Admin
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="identifier-input">
              {tab === 'admin'
                ? 'Admin Username'
                : tab === 'faculty'
                ? 'Faculty Email Address'
                : 'MIS Number'}
            </label>
            <input
              id="identifier-input"
              className="form-input"
              type={tab === 'faculty' ? 'email' : 'text'}
              name="identifier"
              placeholder={
                tab === 'admin'
                  ? 'Enter admin username'
                  : tab === 'faculty'
                  ? 'e.g. prof.name@coeptech.ac.in'
                  : '9-digit MIS number'
              }
              value={form.identifier}
              onChange={handleChange}
              maxLength={tab === 'student' ? 9 : 80}
              inputMode={tab === 'student' ? 'numeric' : tab === 'faculty' ? 'email' : 'text'}
              autoComplete={tab === 'faculty' ? 'email' : 'username'}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <div className="login-form__pass-wrap">
              <input
                id="password-input"
                className="form-input"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-form__eye"
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary login-form__submit"
            disabled={loading}
          >
            {loading ? <><span className="login-spinner" /> Signing in…</> : (tab === 'admin' ? 'Login as Admin' : tab === 'faculty' ? 'Login as Faculty' : 'Login to Portal')}
          </button>

          {tab === 'student' && (
            <p className="login-help">
              New student?{' '}
              <Link to="/register" className="login-help__link">Create student account</Link>
            </p>
          )}

          {tab === 'faculty' && (
            <p className="login-help">
              New faculty member?{' '}
              <Link to="/register?role=faculty" className="login-help__link">Register as faculty</Link>
            </p>
          )}
        </form>

        <div className="login-card__footer">
          {tab === 'admin'
            ? <p>Admin credentials are set by the system administrator.</p>
            : tab === 'faculty'
            ? <p>Use your registered COEP faculty email address to log in.</p>
            : <p>Use your 9-digit COEP MIS number to log in.</p>
          }
        </div>
      </div>

      {/* Side affirmations */}
      <div className="login-side animate-slide-in delay-300">
        <div className="login-affirmation-stack">
          {quotes.map((text, i) => (
            <div key={i} className="login-affirmation-chip glass" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="affirmation-dot" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
