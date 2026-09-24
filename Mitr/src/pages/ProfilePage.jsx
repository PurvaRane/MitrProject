import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { userAPI } from '../api';
import './ProfilePage.css';

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

export default function ProfilePage() {
  const { user, updateUser, logout } = useContext(AuthContext);

  const [isEditingDept, setIsEditingDept] = useState(false);
  const [deptInput, setDeptInput] = useState(user?.department || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';

  const handleUpdateDept = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await userAPI.updateProfile({ department: deptInput });
      if (res.success && res.user) {
        updateUser(res.user);
        setIsEditingDept(false);
        setMessage({ text: 'Department updated successfully.', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      }
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update department.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="container">
          <span className="section-tag">
            {isAdmin ? 'Admin Account' : isFaculty ? 'Faculty Profile' : 'Student Profile'}
          </span>
          <h1 className="section-title">My Account</h1>
          <div className="divider" />
          <p className="section-subtitle">
            Manage your personal profile and preferences on the COEP "मित्र" platform.
          </p>
        </div>
      </div>

      <div className="container profile-layout section">
        <div className="profile-card card glass">
          <div className="profile-card__avatar">
            <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
          </div>

          <div className="profile-card__identity">
            <h2 className="profile-card__name">
              {isFaculty && !user?.name?.match(/^(Dr\.|Prof\.)/i) ? `Prof. ${user?.name}` : user?.name}
            </h2>
            <span className={`badge badge-${isAdmin ? 'blue' : isFaculty ? 'lavender' : 'mint'}`}>
              {isAdmin ? 'Administrator' : isFaculty ? 'Faculty Member' : 'Student'}
            </span>
          </div>

          {message.text && (
            <div className={`profile-alert profile-alert--${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="profile-fields">
            <div className="profile-field">
              <span className="profile-field__label">Full Name</span>
              <span className="profile-field__value">{user?.name || '—'}</span>
            </div>

            {isFaculty && (
              <div className="profile-field">
                <span className="profile-field__label">Email Address</span>
                <span className="profile-field__value">{user?.email || '—'}</span>
              </div>
            )}

            {!isFaculty && !isAdmin && (
              <>
                <div className="profile-field">
                  <span className="profile-field__label">MIS Number</span>
                  <span className="profile-field__value">{user?.misId || '—'}</span>
                </div>

                <div className="profile-field">
                  <span className="profile-field__label">Year &amp; Branch</span>
                  <span className="profile-field__value">
                    {user?.year} · {user?.branch}
                  </span>
                </div>
              </>
            )}

            {isFaculty && (
              <div className="profile-field profile-field--editable">
                <div className="profile-field__header">
                  <span className="profile-field__label">Department</span>
                  {!isEditingDept && (
                    <button
                      type="button"
                      className="profile-edit-btn"
                      onClick={() => {
                        setDeptInput(user?.department || '');
                        setIsEditingDept(true);
                      }}
                    >
                      {user?.department ? 'Change' : '+ Add'}
                    </button>
                  )}
                </div>

                {isEditingDept ? (
                  <form onSubmit={handleUpdateDept} className="profile-edit-form">
                    <select
                      className="form-input"
                      value={deptInput}
                      onChange={e => setDeptInput(e.target.value)}
                      autoFocus
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <div className="profile-edit-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsEditingDept(false)}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <span className="profile-field__value">
                    {user?.department || <em style={{ color: 'var(--text-muted)' }}>Not specified</em>}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="profile-card__footer">
            <Link
              to={isAdmin ? '/admin-dashboard' : isFaculty ? '/faculty-dashboard' : '/user-dashboard'}
              className="btn btn-secondary btn-sm"
            >
              ← Back to Dashboard
            </Link>
            <button
              type="button"
              className="btn btn-peach btn-sm"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
