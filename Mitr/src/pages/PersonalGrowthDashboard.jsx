import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Zap,
  Calendar,
  Award,
  BookOpen,
  MessageSquare,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Lock,
  Smile,
  Frown,
  Meh,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { AuthContext } from '../App';
import { useApp } from '../context/AppContext';
import {
  userAPI,
  moodAPI,
  journalAPI,
  appointmentAPI,
  eventsAPI,
  challengeAPI,
} from '../api';
import PlatformFeedbackSection from '../components/PlatformFeedbackSection';
import './PersonalGrowthDashboard.css';

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

const FEELING_OPTIONS = [
  { id: 'calm', label: 'Calm', emoji: '😌' },
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'motivated', label: 'Motivated', emoji: '🔥' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
  { id: 'stressed', label: 'Stressed', emoji: '😣' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' },
  { id: 'frustrated', label: 'Frustrated', emoji: '😤' },
  { id: 'angry', label: 'Angry', emoji: '😠' },
  { id: 'lonely', label: 'Lonely', emoji: '🫂' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
];

export default function PersonalGrowthDashboard() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const { challenges } = useApp();

  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';

  // ── Navigation Tabs ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'mood' | 'care' | 'activity' | 'vault' | 'feedback'

  // ── Department Editing ─────────────────────────────────────────────────────
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [deptInput, setDeptInput] = useState(user?.department || '');
  const [savingDept, setSavingDept] = useState(false);
  const [deptMessage, setDeptMessage] = useState({ text: '', type: '' });

  // ── Mood Analytics State ───────────────────────────────────────────────────
  const [todayMood, setTodayMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [moodForm, setMoodForm] = useState({
    moodScore: 4,
    energyScore: 3,
    feeling: '',
    note: '',
  });
  const [savingMood, setSavingMood] = useState(false);
  const [moodSuccess, setMoodSuccess] = useState('');
  const [moodError, setMoodError] = useState('');

  // ── Care History State ─────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [assignedExercises, setAssignedExercises] = useState([
    // Extensible counselor-assigned exercise interface
    {
      id: 'ex-1',
      title: 'Box Breathing (4-4-4-4 Technique)',
      assignedDate: '2026-09-20',
      frequency: 'Daily before sleep',
      status: 'Pending',
      description: 'Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. Complete 4 cycles to activate the parasympathetic nervous system.',
    },
  ]);

  // ── Activity Tracker State ─────────────────────────────────────────────────
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [joinedChallenges, setJoinedChallenges] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // ── Reflection Vault State ─────────────────────────────────────────────────
  const [vaultEntries, setVaultEntries] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(true);
  const [vaultSearch, setVaultSearch] = useState('');
  const [selectedFeelingFilter, setSelectedFeelingFilter] = useState('all');
  const [viewingEntry, setViewingEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', mood: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Fetch Initial Data ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchMoodData();
    fetchCareHistory();
    fetchActivityData();
    fetchVaultEntries();
  }, []);

  const fetchMoodData = async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        moodAPI.getToday(),
        moodAPI.getHistory(7),
      ]);
      if (todayRes.success && todayRes.entry) {
        setTodayMood(todayRes.entry);
        setMoodForm({
          moodScore: todayRes.entry.moodScore,
          energyScore: todayRes.entry.energyScore,
          feeling: todayRes.entry.feeling || '',
          note: todayRes.entry.note || '',
        });
      }
      if (historyRes.success) {
        setMoodHistory(historyRes.history || []);
      }
    } catch (err) {
      console.error('Failed to load mood data:', err);
    }
  };

  const fetchCareHistory = async () => {
    setAppointmentsLoading(true);
    try {
      const res = await appointmentAPI.getMyAppointments();
      if (res.success) {
        setAppointments(res.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load care history:', err);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchActivityData = async () => {
    setActivityLoading(true);
    try {
      const [eventsRes, challengesRes] = await Promise.all([
        eventsAPI.getMyRegistrations(),
        challengeAPI.getAll(),
      ]);
      if (eventsRes.success) {
        setRegisteredEvents(eventsRes.registrations || []);
      }
      if (challengesRes.success) {
        setJoinedChallenges(challengesRes.challenges || []);
      }
    } catch (err) {
      console.error('Failed to load activity tracker data:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchVaultEntries = async () => {
    setVaultLoading(true);
    try {
      const res = await journalAPI.getVault();
      if (res.success) {
        setVaultEntries(res.entries || []);
      }
    } catch (err) {
      console.error('Failed to load vault reflections:', err);
    } finally {
      setVaultLoading(false);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUpdateDept = async (e) => {
    e.preventDefault();
    setSavingDept(true);
    setDeptMessage({ text: '', type: '' });
    try {
      const res = await userAPI.updateProfile({ department: deptInput });
      if (res.success && res.user) {
        updateUser(res.user);
        setIsEditingDept(false);
        setDeptMessage({ text: 'Department updated successfully.', type: 'success' });
        setTimeout(() => setDeptMessage({ text: '', type: '' }), 4000);
      }
    } catch (err) {
      setDeptMessage({ text: err.message || 'Failed to update department.', type: 'error' });
    } finally {
      setSavingDept(false);
    }
  };

  const handleMoodSubmit = async (e) => {
    e.preventDefault();
    if (savingMood) return;
    setSavingMood(true);
    setMoodError('');
    setMoodSuccess('');

    try {
      const res = await moodAPI.checkIn({
        moodScore: moodForm.moodScore,
        energyScore: moodForm.energyScore,
        feeling: moodForm.feeling,
        note: moodForm.note,
      });
      if (res.success) {
        setTodayMood(res.entry);
        setMoodSuccess('Daily check-in recorded! Keep building self-awareness.');
        fetchMoodData();
        setTimeout(() => setMoodSuccess(''), 4000);
      }
    } catch (err) {
      setMoodError(err.message || 'Failed to record check-in.');
    } finally {
      setSavingMood(false);
    }
  };

  const handleDeleteVaultEntry = async (id) => {
    if (!window.confirm('Delete this private journal entry permanently?')) return;
    try {
      const res = await journalAPI.delete(id);
      if (res.success) {
        setVaultEntries(prev => prev.filter(item => item._id !== id));
        if (viewingEntry?._id === id) setViewingEntry(null);
      }
    } catch (err) {
      alert('Failed to delete entry: ' + err.message);
    }
  };

  const handleStartEdit = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      title: entry.title || '',
      body: entry.body || '',
      mood: entry.mood || 'none',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingEntry || savingEdit) return;
    setSavingEdit(true);

    try {
      const res = await journalAPI.update(editingEntry._id, {
        title: editForm.title.trim(),
        body: editForm.body.trim(),
        mood: editForm.mood,
      });
      if (res.success) {
        setVaultEntries(prev =>
          prev.map(item => (item._id === editingEntry._id ? { ...item, ...res.entry } : item))
        );
        setEditingEntry(null);
      }
    } catch (err) {
      alert('Failed to update entry: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleExercise = (exerciseId) => {
    setAssignedExercises(prev =>
      prev.map(ex =>
        ex.id === exerciseId
          ? { ...ex, status: ex.status === 'Completed' ? 'Pending' : 'Completed' }
          : ex
      )
    );
  };

  // ── Streak Calculation (Non-competitive) ───────────────────────────────────
  const calculateStreak = () => {
    if (vaultEntries.length === 0 && moodHistory.length === 0) return 0;
    // Combine unique activity dates
    const activityDates = new Set();
    vaultEntries.forEach(e => activityDates.add(e.createdAt?.slice(0, 10)));
    moodHistory.forEach(m => activityDates.add(m.date));

    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000 + 5.5 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      if (activityDates.has(d)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  // ── Filtered Vault Entries ─────────────────────────────────────────────────
  const filteredVault = vaultEntries.filter(entry => {
    const matchesSearch =
      (entry.title || '').toLowerCase().includes(vaultSearch.toLowerCase()) ||
      (entry.body || '').toLowerCase().includes(vaultSearch.toLowerCase());
    const matchesFeeling =
      selectedFeelingFilter === 'all' || entry.mood === selectedFeelingFilter;
    return matchesSearch && matchesFeeling;
  });

  return (
    <div className="personal-growth-page">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="pg-header">
        <div className="container">
          <div className="pg-header__meta">
            <span className="section-tag">
              {isAdmin ? 'Admin Portal' : isFaculty ? 'Faculty Wellbeing' : 'Student Growth'}
            </span>
            <div className="pg-privacy-pill">
              <Lock size={13} />
              <span>Private to You</span>
            </div>
          </div>

          <div className="pg-header__intro">
            <div>
              <h1 className="pg-header__title">
                Personal Growth Dashboard
              </h1>
              <div className="divider" style={{ marginBottom: '0.75rem' }} />
              <p className="pg-header__subtitle">
                Track your emotional wellbeing, reflect on your thoughts, and review your personal care journey at COEP.
              </p>
            </div>

            <div className="pg-user-badge glass">
              <div className="pg-avatar">
                <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="pg-user-info">
                <strong>
                  {isFaculty && !user?.name?.match(/^(Dr\.|Prof\.)/i) ? `Prof. ${user?.name}` : user?.name}
                </strong>
                <span>
                  {isFaculty ? user?.department || 'Faculty' : `${user?.branch || 'Student'} (${user?.year || 'COEP'})`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pg-metrics-grid">
            <div className="pg-metric-card card">
              <div className="pg-metric-icon pg-metric-icon--streak">
                <Sparkles size={20} />
              </div>
              <div className="pg-metric-data">
                <span className="pg-metric-value">{calculateStreak()} Days</span>
                <span className="pg-metric-label">Mindful Streak</span>
              </div>
            </div>

            <div className="pg-metric-card card">
              <div className="pg-metric-icon pg-metric-icon--mood">
                <Heart size={20} />
              </div>
              <div className="pg-metric-data">
                <span className="pg-metric-value">
                  {todayMood ? `${todayMood.moodScore}/5` : 'Not Logged'}
                </span>
                <span className="pg-metric-label">Today's Mood</span>
              </div>
            </div>

            <div className="pg-metric-card card">
              <div className="pg-metric-icon pg-metric-icon--reflections">
                <BookOpen size={20} />
              </div>
              <div className="pg-metric-data">
                <span className="pg-metric-value">{vaultEntries.length}</span>
                <span className="pg-metric-label">Reflections Saved</span>
              </div>
            </div>

            <div className="pg-metric-card card">
              <div className="pg-metric-icon pg-metric-icon--care">
                <Activity size={20} />
              </div>
              <div className="pg-metric-data">
                <span className="pg-metric-value">{appointments.length}</span>
                <span className="pg-metric-label">Care Sessions</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Subnav Tabs ─────────────────────────────────────────────────────── */}
      <div className="pg-nav-bar">
        <div className="container pg-nav-bar__inner">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'mood', label: 'Mood Analytics', icon: Heart },
            { id: 'vault', label: 'Reflection Vault', icon: BookOpen },
            { id: 'care', label: 'Care History', icon: Activity },
            { id: 'activity', label: 'Activity Tracker', icon: Award },
            { id: 'feedback', label: 'Feedback', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`pg-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Tab Contents ──────────────────────────────────────────────── */}
      <main className="container section pg-main-content">

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="pg-overview-grid animate-fade-in">

            {/* Daily Check-in Snapshot */}
            <div className="card pg-card pg-card--highlight">
              <div className="pg-card__header">
                <div>
                  <span className="section-tag">Daily Check-In</span>
                  <h2 className="pg-card__title">How are you feeling right now?</h2>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('mood')}
                >
                  View Analytics →
                </button>
              </div>

              {todayMood ? (
                <div className="pg-today-mood-summary glass-blue">
                  <div className="pg-today-mood-info">
                    <span className="pg-today-badge">Today's Check-in Complete</span>
                    <div className="pg-today-scores">
                      <span>Mood: <strong>{todayMood.moodScore}/5</strong></span>
                      <span>•</span>
                      <span>Energy: <strong>{todayMood.energyScore}/5</strong></span>
                      {todayMood.feeling && (
                        <>
                          <span>•</span>
                          <span>Feeling: <strong style={{ textTransform: 'capitalize' }}>{todayMood.feeling}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveTab('mood')}
                  >
                    Update Check-In
                  </button>
                </div>
              ) : (
                <div className="pg-today-unlogged">
                  <p>You haven't logged your emotional pulse today. A quick 10-second check-in helps spot stress patterns.</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActiveTab('mood')}
                  >
                    Complete Today's Check-in
                  </button>
                </div>
              )}
            </div>

            {/* Account Details & Department Update */}
            <div className="card pg-card">
              <div className="pg-card__header">
                <div>
                  <span className="section-tag">Account Details</span>
                  <h2 className="pg-card__title">Profile Information</h2>
                </div>
              </div>

              {deptMessage.text && (
                <div className={`profile-alert profile-alert--${deptMessage.type}`} style={{ marginBottom: 'var(--space-md)' }}>
                  {deptMessage.text}
                </div>
              )}

              <div className="profile-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                <div className="profile-field">
                  <span className="profile-field__label">Full Name</span>
                  <span className="profile-field__value">{user?.name || '-'}</span>
                </div>
                {isFaculty ? (
                  <div className="profile-field">
                    <span className="profile-field__label">Faculty Email</span>
                    <span className="profile-field__value">{user?.email || '-'}</span>
                  </div>
                ) : (
                  <div className="profile-field">
                    <span className="profile-field__label">MIS ID</span>
                    <span className="profile-field__value">{user?.misId || '-'}</span>
                  </div>
                )}
                <div className="profile-field">
                  <span className="profile-field__label">Department / Branch</span>
                  {isEditingDept ? (
                    <form onSubmit={handleUpdateDept} style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <select
                        className="form-input"
                        value={deptInput}
                        onChange={e => setDeptInput(e.target.value)}
                        style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={savingDept}>
                        {savingDept ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditingDept(false)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span className="profile-field__value">{user?.department || user?.branch || 'Not specified'}</span>
                      <button
                        type="button"
                        className="btn-edit-inline"
                        onClick={() => { setIsEditingDept(true); setDeptInput(user?.department || ''); }}
                        title="Edit Department"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links Split */}
            <div className="pg-overview-split">
              {/* Vault Preview */}
              <div className="card pg-card">
                <div className="pg-card__header">
                  <h3 className="pg-card__title">Recent Reflections</h3>
                  <button type="button" className="btn-link" onClick={() => setActiveTab('vault')}>
                    Open Vault ({vaultEntries.length}) →
                  </button>
                </div>
                {vaultEntries.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>No reflections yet. Write your thoughts in the Reflection Journal.</p>
                ) : (
                  <div className="pg-mini-list">
                    {vaultEntries.slice(0, 3).map(entry => (
                      <div key={entry._id} className="pg-mini-item" onClick={() => { setViewingEntry(entry); setActiveTab('vault'); }}>
                        <div className="pg-mini-item__top">
                          <strong>{entry.title}</strong>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{entry.createdAt?.slice(0, 10)}</span>
                        </div>
                        <p className="pg-mini-item__desc">{(entry.body || '').slice(0, 80)}…</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Care History Preview */}
              <div className="card pg-card">
                <div className="pg-card__header">
                  <h3 className="pg-card__title">Care History</h3>
                  <button type="button" className="btn-link" onClick={() => setActiveTab('care')}>
                    View Care Details →
                  </button>
                </div>
                {appointments.length === 0 ? (
                  <div className="pg-empty-inline">
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>No care sessions booked yet.</p>
                    <Link to="/book-appointment" className="btn btn-primary btn-sm" style={{ marginTop: '8px', display: 'inline-block' }}>
                      Book Session with Dr. Moghe
                    </Link>
                  </div>
                ) : (
                  <div className="pg-mini-list">
                    {appointments.slice(0, 2).map(appt => (
                      <div key={appt._id} className="pg-mini-item">
                        <div className="pg-mini-item__top">
                          <strong>Dr. Kshipra V. Moghe</strong>
                          <span className={`badge badge-${appt.status === 'Confirmed' ? 'mint' : 'lavender'}`}>
                            {appt.status}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                          📅 {appt.date} • ⏰ {appt.startTime || 'Scheduled'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: MOOD ANALYTICS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'mood' && (
          <div className="pg-mood-section animate-fade-in">
            <div className="pg-section-intro">
              <span className="section-tag">Emotional Check-In</span>
              <h2 className="section-title">Mood &amp; Energy Analytics</h2>
              <div className="divider" />
              <p className="section-subtitle">
                A simple, non-diagnostic reflection tool to notice how your mind and body feel over time.
              </p>
            </div>

            {moodSuccess && (
              <div className="feedback-alert feedback-alert--success">
                <span>✓</span> {moodSuccess}
              </div>
            )}
            {moodError && (
              <div className="feedback-alert feedback-alert--error">
                <span>⚠️</span> {moodError}
              </div>
            )}

            <div className="pg-mood-layout grid-responsive">
              {/* Daily Log Form Card */}
              <div className="card pg-card pg-card--form">
                <div className="pg-card__header">
                  <h3 className="pg-card__title">
                    {todayMood ? 'Update Today\'s Check-In' : 'Today\'s Check-In'}
                  </h3>
                  <div className="pg-privacy-pill">
                    <Lock size={12} />
                    <span>Private</span>
                  </div>
                </div>

                <form onSubmit={handleMoodSubmit} className="pg-mood-form">
                  {/* Mood Score (1-5) */}
                  <div className="form-group">
                    <label className="form-label">
                      Mood Pulse: <span className="pg-score-tag">{moodForm.moodScore} / 5</span>
                    </label>
                    <div className="pg-rating-options">
                      {[
                        { val: 1, label: 'Very Low', icon: Frown },
                        { val: 2, label: 'Low', icon: Frown },
                        { val: 3, label: 'Okay', icon: Meh },
                        { val: 4, label: 'Good', icon: Smile },
                        { val: 5, label: 'Very Good', icon: Smile },
                      ].map(item => {
                        const Icon = item.icon;
                        const isSelected = moodForm.moodScore === item.val;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            className={`pg-rate-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => setMoodForm(prev => ({ ...prev, moodScore: item.val }))}
                          >
                            <Icon size={20} />
                            <span className="pg-rate-num">{item.val}</span>
                            <span className="pg-rate-lbl">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Energy Score (1-5) */}
                  <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
                    <label className="form-label">
                      Energy Level: <span className="pg-score-tag">{moodForm.energyScore} / 5</span>
                    </label>
                    <div className="pg-rating-options">
                      {[
                        { val: 1, label: 'Exhausted' },
                        { val: 2, label: 'Low' },
                        { val: 3, label: 'Moderate' },
                        { val: 4, label: 'High' },
                        { val: 5, label: 'Very High' },
                      ].map(item => {
                        const isSelected = moodForm.energyScore === item.val;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            className={`pg-rate-btn pg-rate-btn--energy ${isSelected ? 'active' : ''}`}
                            onClick={() => setMoodForm(prev => ({ ...prev, energyScore: item.val }))}
                          >
                            <Zap size={18} />
                            <span className="pg-rate-num">{item.val}</span>
                            <span className="pg-rate-lbl">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Feeling Tag */}
                  <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
                    <label className="form-label">Primary Feeling (Optional)</label>
                    <div className="pg-feeling-chips">
                      {FEELING_OPTIONS.map(opt => {
                        const isSelected = moodForm.feeling === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={`pg-feeling-chip ${isSelected ? 'active' : ''}`}
                            onClick={() =>
                              setMoodForm(prev => ({
                                ...prev,
                                feeling: isSelected ? '' : opt.id,
                              }))
                            }
                          >
                            <span>{opt.emoji}</span>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Short Note */}
                  <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                    <label className="form-label" htmlFor="mood-note">
                      Short Note / Context (Optional)
                    </label>
                    <input
                      id="mood-note"
                      type="text"
                      className="form-input"
                      placeholder="e.g. finished midterms, great morning walk, busy labs..."
                      value={moodForm.note}
                      onChange={e => setMoodForm(prev => ({ ...prev, note: e.target.value }))}
                      maxLength={1000}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={savingMood}
                    style={{ marginTop: 'var(--space-md)' }}
                  >
                    {savingMood ? 'Saving…' : todayMood ? 'Update Check-In' : 'Save Today\'s Check-In'}
                  </button>
                </form>
              </div>

              {/* Weekly Trend Chart Card */}
              <div className="card pg-card pg-card--chart">
                <div className="pg-card__header">
                  <div>
                    <h3 className="pg-card__title">This Week's Trend</h3>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      Visual pulse of your mood (purple) and energy (teal) over the last 7 days.
                    </p>
                  </div>
                </div>

                {moodHistory.length === 0 ? (
                  <div className="pg-empty-chart">
                    <Heart size={36} className="text-muted" />
                    <p>No check-in entries yet. Complete today's check-in to see your chart populate!</p>
                  </div>
                ) : (
                  <div className="pg-chart-container">
                    <div className="pg-chart-bars">
                      {moodHistory.map(entry => {
                        const dateObj = new Date(entry.date + 'T12:00:00');
                        const dayLabel = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                        const moodHeight = (entry.moodScore / 5) * 100;
                        const energyHeight = (entry.energyScore / 5) * 100;

                        return (
                          <div key={entry._id || entry.date} className="pg-chart-col">
                            <div className="pg-chart-track">
                              {/* Mood Bar */}
                              <div
                                className="pg-bar pg-bar--mood"
                                style={{ height: `${moodHeight}%` }}
                                title={`Mood: ${entry.moodScore}/5`}
                              >
                                <span className="pg-bar-val">{entry.moodScore}</span>
                              </div>
                              {/* Energy Bar */}
                              <div
                                className="pg-bar pg-bar--energy"
                                style={{ height: `${energyHeight}%` }}
                                title={`Energy: ${entry.energyScore}/5`}
                              >
                                <span className="pg-bar-val">{entry.energyScore}</span>
                              </div>
                            </div>
                            <span className="pg-chart-day">{dayLabel}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pg-chart-legend">
                      <div className="pg-legend-item">
                        <span className="pg-legend-dot pg-legend-dot--mood" />
                        <span>Mood (1–5)</span>
                      </div>
                      <div className="pg-legend-item">
                        <span className="pg-legend-dot pg-legend-dot--energy" />
                        <span>Energy (1–5)</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pg-privacy-note glass-blue" style={{ marginTop: 'var(--space-lg)' }}>
                  <Lock size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ margin: 0, fontSize: '0.825rem', lineHeight: 1.5 }}>
                    <strong>Privacy Guarantee:</strong> Mood scores and entries are strictly private to your account. No administrator, teacher, or peer can view individual mood logs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: REFLECTION VAULT
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'vault' && (
          <div className="pg-vault-section animate-fade-in">
            <div className="pg-section-intro">
              <span className="section-tag">Private Archive</span>
              <h2 className="section-title">Reflection Vault</h2>
              <div className="divider" />
              <p className="section-subtitle">
                Your safe, encrypted digital sanctuary. Review past journal entries and challenge reflections anytime.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="pg-vault-controls card glass">
              <div className="pg-vault-search">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search your reflections by title or content…"
                  value={vaultSearch}
                  onChange={e => setVaultSearch(e.target.value)}
                />
              </div>

              <div className="pg-vault-filters">
                <button
                  type="button"
                  className={`pg-vault-filter-btn ${selectedFeelingFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedFeelingFilter('all')}
                >
                  All Feelings ({vaultEntries.length})
                </button>
                {FEELING_OPTIONS.slice(0, 6).map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className={`pg-vault-filter-btn ${selectedFeelingFilter === f.id ? 'active' : ''}`}
                    onClick={() => setSelectedFeelingFilter(f.id)}
                  >
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vault Grid */}
            {vaultLoading ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                Opening your secure Reflection Vault…
              </p>
            ) : filteredVault.length === 0 ? (
              <div className="card pg-vault-empty">
                <BookOpen size={48} className="text-muted" />
                <h3>No reflections found</h3>
                <p>
                  {vaultEntries.length === 0
                    ? 'You have not written any reflection journal entries yet. Writing helps untangle anxious thoughts.'
                    : 'No reflections match your current filter or search criteria.'}
                </p>
                <Link to="/reflect" className="btn btn-primary btn-sm">
                  Write a Reflection in Journal
                </Link>
              </div>
            ) : (
              <div className="pg-vault-grid grid-responsive">
                {filteredVault.map(entry => {
                  const isPersonal = entry.type === 'journal';
                  return (
                    <div key={entry._id} className="card pg-vault-card animate-fade-in">
                      <div className="pg-vault-card__top">
                        <span className={`badge badge-${isPersonal ? 'lavender' : 'mint'}`}>
                          {isPersonal ? 'Personal Journal' : 'Challenge Activity'}
                        </span>
                        {entry.mood && entry.mood !== 'none' && (
                          <span className="pg-vault-card__mood">
                            {FEELING_OPTIONS.find(f => f.id === entry.mood)?.emoji || '💭'}{' '}
                            {entry.mood}
                          </span>
                        )}
                        <span className="pg-vault-card__date">
                          {entry.createdAt?.slice(0, 10)}
                        </span>
                      </div>

                      <h3 className="pg-vault-card__title">{entry.title}</h3>
                      <p className="pg-vault-card__preview">
                        {(entry.body || '').slice(0, 140)}
                        {(entry.body || '').length > 140 ? '…' : ''}
                      </p>

                      <div className="pg-vault-card__footer">
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => setViewingEntry(entry)}
                        >
                          Read Full Entry →
                        </button>

                        {entry.canEdit && (
                          <div className="pg-vault-card__actions">
                            <button
                              type="button"
                              className="btn-icon"
                              title="Edit Entry"
                              onClick={() => handleStartEdit(entry)}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-icon--danger"
                              title="Delete Entry"
                              onClick={() => handleDeleteVaultEntry(entry._id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View Full Entry Modal */}
            {viewingEntry && (
              <div className="pg-modal-backdrop" onClick={() => setViewingEntry(null)}>
                <div className="pg-modal card animate-fade-in-up" onClick={e => e.stopPropagation()}>
                  <div className="pg-modal__header">
                    <div>
                      <span className="section-tag">
                        {viewingEntry.type === 'journal' ? 'Private Journal Entry' : 'Challenge Reflection'}
                      </span>
                      <h2 className="pg-modal__title">{viewingEntry.title}</h2>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Saved on {viewingEntry.createdAt?.slice(0, 10)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="pg-modal__close"
                      onClick={() => setViewingEntry(null)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="pg-modal__body">
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem' }}>
                      {viewingEntry.body}
                    </p>
                  </div>

                  <div className="pg-modal__footer">
                    {viewingEntry.canEdit && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          handleStartEdit(viewingEntry);
                          setViewingEntry(null);
                        }}
                      >
                        Edit Entry
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setViewingEntry(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Entry Modal */}
            {editingEntry && (
              <div className="pg-modal-backdrop" onClick={() => setEditingEntry(null)}>
                <div className="pg-modal card animate-fade-in-up" onClick={e => e.stopPropagation()}>
                  <div className="pg-modal__header">
                    <div>
                      <span className="section-tag">Edit Entry</span>
                      <h2 className="pg-modal__title">Update Reflection</h2>
                    </div>
                    <button
                      type="button"
                      className="pg-modal__close"
                      onClick={() => setEditingEntry(null)}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveEdit} className="pg-modal__body">
                    <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                      <label className="form-label" htmlFor="edit-title">Title</label>
                      <input
                        id="edit-title"
                        type="text"
                        className="form-input"
                        value={editForm.title}
                        onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                      <label className="form-label" htmlFor="edit-body">Reflection Content</label>
                      <textarea
                        id="edit-body"
                        className="form-input"
                        rows="6"
                        value={editForm.body}
                        onChange={e => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Feeling Tag</label>
                      <select
                        className="form-input"
                        value={editForm.mood}
                        onChange={e => setEditForm(prev => ({ ...prev, mood: e.target.value }))}
                      >
                        <option value="none">None</option>
                        {FEELING_OPTIONS.map(f => (
                          <option key={f.id} value={f.id}>{f.emoji} {f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pg-modal__footer" style={{ marginTop: 'var(--space-lg)' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingEntry(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={savingEdit}
                      >
                        {savingEdit ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: CARE HISTORY
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'care' && (
          <div className="pg-care-section animate-fade-in">
            <div className="pg-section-intro">
              <span className="section-tag">Confidential Support</span>
              <h2 className="section-title">Care &amp; Counseling History</h2>
              <div className="divider" />
              <p className="section-subtitle">
                Your private record of consultations with university counselor Dr. Kshipra V. Moghe and assigned wellbeing exercises.
              </p>
            </div>

            {/* Care Sessions List */}
            <div className="card pg-card">
              <div className="pg-card__header">
                <div>
                  <h3 className="pg-card__title">Counselling Consultations</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    Appointments booked through the COEP मित्र booking system.
                  </p>
                </div>
                <Link to="/book-appointment" className="btn btn-mint btn-sm">
                  Book New Session
                </Link>
              </div>

              {appointmentsLoading ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                  Loading care history…
                </p>
              ) : appointments.length === 0 ? (
                <div className="pg-care-empty">
                  <Activity size={40} className="text-muted" />
                  <p className="pg-care-empty__title">No care history yet.</p>
                  <p className="pg-care-empty__sub">
                    Reaching out for help is an act of strength. Confidential one-on-one sessions are available at no charge for all COEP Tech students and faculty.
                  </p>
                  <Link to="/book-appointment" className="btn btn-primary btn-sm">
                    Book an Appointment with Dr. Moghe
                  </Link>
                </div>
              ) : (
                <div className="pg-care-list">
                  {appointments.map(appt => (
                    <div key={appt._id} className="pg-care-item card">
                      <div className="pg-care-item__header">
                        <div>
                          <h4 className="pg-care-item__counselor">Dr. Kshipra V. Moghe</h4>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            Consulting Psychologist &amp; Incharge - COEP मित्र
                          </span>
                        </div>
                        <span className={`badge badge-${appt.status === 'Confirmed' ? 'mint' : appt.status === 'Cancelled' ? 'peach' : 'lavender'}`}>
                          {appt.status}
                        </span>
                      </div>

                      <div className="pg-care-item__details">
                        <div className="pg-care-detail">
                          <Calendar size={14} />
                          <span>Date: <strong>{appt.date}</strong></span>
                        </div>
                        {appt.startTime && (
                          <div className="pg-care-detail">
                            <Clock size={14} />
                            <span>Slot: <strong>{appt.startTime} - {appt.endTime || ''}</strong></span>
                          </div>
                        )}
                        {appt.appointmentId && (
                          <div className="pg-care-detail">
                            <span>ID: <strong style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{appt.appointmentId}</strong></span>
                          </div>
                        )}
                        {appt.reason && (
                          <div className="pg-care-detail" style={{ gridColumn: '1 / -1' }}>
                            <span>Focus: {appt.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extensible Assigned Exercises Architecture */}
            <div className="card pg-card" style={{ marginTop: 'var(--space-xl)' }}>
              <div className="pg-card__header">
                <div>
                  <span className="section-tag">Extensible Care Architecture</span>
                  <h3 className="pg-card__title">Assigned Exercises &amp; Tasks</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    Mindfulness, sleep hygiene, and cognitive exercises assigned during clinical consultations.
                  </p>
                </div>
              </div>

              <div className="pg-exercises-list">
                {assignedExercises.map(ex => {
                  const isDone = ex.status === 'Completed';
                  return (
                    <div key={ex.id} className="pg-exercise-card card glass">
                      <div className="pg-exercise-card__top">
                        <div>
                          <h4 className="pg-exercise-card__title">{ex.title}</h4>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            Assigned on {ex.assignedDate} • {ex.frequency}
                          </span>
                        </div>
                        <span className={`badge badge-${isDone ? 'mint' : 'lavender'}`}>
                          {ex.status}
                        </span>
                      </div>

                      <p className="pg-exercise-card__desc">{ex.description}</p>

                      <div className="pg-exercise-card__actions">
                        <button
                          type="button"
                          className={`btn btn-${isDone ? 'secondary' : 'primary'} btn-sm`}
                          onClick={() => handleToggleExercise(ex.id)}
                        >
                          {isDone ? 'Mark as Incomplete' : 'Mark Complete ✓'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 5: ACTIVITY TRACKER
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'activity' && (
          <div className="pg-activity-section animate-fade-in">
            <div className="pg-section-intro">
              <span className="section-tag">Progress &amp; Habits</span>
              <h2 className="section-title">Activity Tracker</h2>
              <div className="divider" />
              <p className="section-subtitle">
                A single hub consolidating your upcoming wellbeing events, active challenges, and personal streaks.
              </p>
            </div>

            <div className="pg-activity-grid grid-responsive">
              {/* Upcoming Events */}
              <div className="card pg-card">
                <div className="pg-card__header">
                  <h3 className="pg-card__title">Registered Events</h3>
                  <Link to="/events" className="btn-link">All Events →</Link>
                </div>

                {registeredEvents.length === 0 ? (
                  <div className="pg-activity-empty">
                    <p className="text-muted">You have not registered for any upcoming events.</p>
                    <Link to="/events" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
                      Browse Campus Events
                    </Link>
                  </div>
                ) : (
                  <div className="pg-activity-list">
                    {registeredEvents.map(reg => {
                      const event = reg.eventId;
                      return (
                        <div key={reg._id} className="pg-activity-item">
                          <div className="pg-activity-item__header">
                            <strong>{event?.title || 'Campus Event'}</strong>
                            <span className="badge badge-mint">{reg.status || 'Registered'}</span>
                          </div>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            📅 {event?.date ? new Date(event.date).toLocaleDateString('en-IN') : 'Upcoming'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Joined Challenges */}
              <div className="card pg-card">
                <div className="pg-card__header">
                  <h3 className="pg-card__title">Wellbeing Challenges</h3>
                  <Link to="/challenge" className="btn-link">Explore Challenges →</Link>
                </div>

                {joinedChallenges.length === 0 ? (
                  <div className="pg-activity-empty">
                    <p className="text-muted">You haven't joined any challenges yet.</p>
                    <Link to="/challenge" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                      Join a Challenge
                    </Link>
                  </div>
                ) : (
                  <div className="pg-activity-list">
                    {joinedChallenges.map(ch => (
                      <div key={ch._id} className="pg-activity-item">
                        <div className="pg-activity-item__header">
                          <strong>{ch.title}</strong>
                          <span className={`badge badge-${ch.status === 'Active' ? 'mint' : ch.status === 'Upcoming' ? 'lavender' : 'blue'}`}>
                            {ch.status}
                          </span>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                          Duration: {ch.duration} Days • {ch.category}
                        </span>
                        <div style={{ marginTop: '6px' }}>
                          <Link to="/challenge" className="btn-link" style={{ fontSize: '0.8rem' }}>
                            Go to Challenge Tasks →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 6: FEEDBACK
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'feedback' && (
          <div className="pg-feedback-tab animate-fade-in">
            <PlatformFeedbackSection
              title="Personal Growth & Platform Feedback"
              subtitle="Share your suggestions, event ideas, digital wellness feature requests, or general thoughts to help shape the future of COEP मित्र."
            />
          </div>
        )}

      </main>
    </div>
  );
}
