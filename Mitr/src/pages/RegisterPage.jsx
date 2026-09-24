import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { authAPI } from '../api';
import './RegisterPage.css';

const YEARS = ['FY BTech', 'SY BTech', 'TY BTech', 'FinalY BTech', 'M.Tech 1st year', 'M.Tech 2nd year', 'PhD'];
const BRANCHES = [
  'Computer Science and Engineering',
  'Electronics and Telecommunication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Instrumentation and Control Engineering',
  'Metallurgy and Materials Technology',
  'Manufacturing Science and Engineering',
  'AI/ML',
  'AI/DS'
];

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Telecommunication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Instrumentation and Control Engineering',
  'Metallurgy and Materials Technology',
  'Manufacturing Science and Engineering',
  'AI / Data Science',
  'Applied Sciences & Humanities',
  'Department of Management',
];

export default function RegisterPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [role, setRole] = useState(
    searchParams.get('role') === 'faculty' ? 'faculty' : 'student'
  );

  const [form, setForm] = useState({
    name: '',
    misId: '',
    year: 'FY BTech',
    branch: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'faculty' && role !== 'faculty') {
      setRole('faculty');
    } else if (urlRole === 'student' && role !== 'student') {
      setRole('student');
    }
  }, [searchParams]);

  const switchRole = (newRole) => {
    setRole(newRole);
    setSearchParams(newRole === 'faculty' ? { role: 'faculty' } : {});
    setError('');
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const isStudentValid =
    form.name.trim() &&
    /^\d{9}$/.test(form.misId.trim()) &&
    form.year &&
    form.branch &&
    form.password.length >= 4 &&
    form.password === form.confirmPassword;

  const isFacultyValid =
    form.name.trim() &&
    /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
    form.password.length >= 4 &&
    form.password === form.confirmPassword;

  const isFormValid = role === 'faculty' ? isFacultyValid : isStudentValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError('');

    setLoading(true);
    try {
      if (role === 'faculty') {
        const data = await authAPI.registerFaculty({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          department: form.department.trim(),
        });
        login(data.user, data.token);
        navigate('/faculty-dashboard');
      } else {
        const data = await authAPI.register({
          name: form.name.trim(),
          misId: form.misId.trim(),
          year: form.year,
          branch: form.branch,
          password: form.password,
        });
        login(data.user, data.token);
        navigate('/user-dashboard');
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Cannot reach server. Please make sure the backend is running.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-blob register-blob--1" />
      <div className="register-blob register-blob--2" />

      <div className="register-card glass animate-fade-in-up">
        <div className="register-card__bar" />

        <div className="register-card__header">
          <Link to="/" className="register-card__logo">COEP मित्र</Link>
          <h1 className="register-card__title">Create your account</h1>
          <p className="register-card__subtitle">
            {role === 'faculty'
              ? 'Join as a faculty member to support your wellbeing at COEP Technological University.'
              : 'Join the Wellness community at COEP Technological University.'}
          </p>
        </div>

        {/* Role switcher */}
        <div className="register-role-tabs">
          <button
            type="button"
            id="reg-tab-student"
            className={`register-role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => switchRole('student')}
          >
            Student
          </button>
          <button
            type="button"
            id="reg-tab-faculty"
            className={`register-role-tab ${role === 'faculty' ? 'active' : ''}`}
            onClick={() => switchRole('faculty')}
          >
            Faculty
          </button>
        </div>

        <form className="register-form" onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              className="form-input"
              type="text"
              name="name"
              placeholder={role === 'faculty' ? 'e.g. Dr. Jane Doe' : 'e.g. ABC'}
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          {role === 'faculty' ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Faculty Email Address</label>
                <input
                  id="reg-email"
                  className="form-input"
                  type="email"
                  name="email"
                  placeholder="e.g. name@coeptech.ac.in"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                  <label className="form-label" htmlFor="reg-dept" style={{ marginBottom: 0 }}>Department</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional)</span>
                </div>
                <select
                  id="reg-dept"
                  className="form-input"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-mis">MIS Number (9 digits)</label>
                <input
                  id="reg-mis"
                  className="form-input"
                  type="text"
                  name="misId"
                  placeholder="e.g. 212212345"
                  value={form.misId}
                  onChange={handleChange}
                  maxLength={9}
                  inputMode="numeric"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="register-form__row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-year">Year</label>
                  <select
                    id="reg-year"
                    className="form-input"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-branch">Branch</label>
                  <select
                    id="reg-branch"
                    className="form-input"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select branch</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="login-form__pass-wrap">
              <input
                id="reg-password"
                className="form-input"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Min. 4 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
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

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              className="form-input"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="register-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary register-form__submit"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <><span className="register-spinner" /> Creating account…</>
            ) : role === 'faculty' ? (
              'Register as Faculty'
            ) : (
              'Create Account'
            )}
          </button>

          <p className="register-help">
            Already have an account?{' '}
            <Link to="/login" className="register-help__link">Sign in</Link>
          </p>
        </form>

        <div className="register-card__footer">
          {role === 'faculty'
            ? 'Your data is kept private and secure. COEP Email is your faculty identifier.'
            : 'Your data is kept private and secure. MIS ID is your unique identifier.'}
        </div>
      </div>

      <div className="register-side animate-slide-in delay-200">
        <div className="register-side__content glass" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)' }}>
          <h2 className="register-side__title">Join the community</h2>
          <ul className="register-side__list">
            {[
              'Access Wellbeing challenges',
              'Build healthy habits with structured challenges',
              'Register for campus wellness events',
              'Write private reflections in your journal',
            ].map((item, i) => (
              <li key={i} className="register-side__item">
                <span className="register-side__dot" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
