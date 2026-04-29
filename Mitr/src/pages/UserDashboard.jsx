import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { useApp } from '../context/AppContext';
import { authAPI } from '../api';
import OnboardingModal from '../components/OnboardingModal';
import './UserDashboard.css';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDaysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function UserDashboard() {
  const { user, updateUser } = useContext(AuthContext);
  const {
    events, eventsLoading,
    wellnessInfo, wellnessLoading,
    eventReports, reportsLoading,
    activeTask, activeDay, challengeLoading,
    challengeProgress, markDone, saveReflection,
  } = useApp();

  const [reflText,     setReflText]     = useState('');
  const [reflMode,     setReflMode]     = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [expandReport, setExpandReport] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && user.hasSeenOnboarding === false) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    setReflText(challengeProgress.reflections[activeDay] || '');
  }, [activeDay, challengeProgress.reflections]);

  const isDone    = !!challengeProgress.done[activeDay];
  const hasRefl   = !!challengeProgress.reflections[activeDay];
  const doneCount = challengeProgress.doneCount ?? 0;
  const streak    = challengeProgress.streak ?? 0;
  const progress  = Math.round((doneCount / 30) * 100);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveRefl = async () => {
    await saveReflection(activeDay, reflText, imagePreview);
    setReflMode(false);
    setImagePreview(null);
  };

  const handleOnboardingComplete = async () => {
    try {
      await authAPI.completeOnboarding();
      updateUser({ hasSeenOnboarding: true });
      setShowOnboarding(false);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setShowOnboarding(false);
    }
  };

  return (
    <div className="user-dash">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      {/* Header */}
      <div className="user-dash__header">
        <div className="container user-dash__header-inner">
          <div>
            <span className="section-tag">Student Dashboard</span>
            <h1 className="user-dash__title">Hello, {user?.name?.split(' ')[0] || 'Student'}</h1>
            <p className="user-dash__sub">
              {user?.year && user?.branch ? `${user.year} · ${user.branch}` : 'COEP मित्र Wellness Platform'}
            </p>
          </div>
          <div className="user-dash__stats-row">
            <div className="user-dash__stat-chip glass">
              <div className="user-dash__stat-val">{doneCount}<span>/30</span></div>
              <div className="user-dash__stat-label">Days Done</div>
            </div>
            <div className="user-dash__stat-chip glass">
              <div className="user-dash__stat-val">{streak}</div>
              <div className="user-dash__stat-label">Day Streak</div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="progress-bar-track" style={{ marginTop: 'var(--space-md)' }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="user-dash__progress-label">{progress}% of 30-day challenge complete</p>
        </div>
      </div>

      <div className="container user-dash__body">

        {/* ── Wellness Info ── */}
        {!wellnessLoading && wellnessInfo && (
          <section className="user-dash__section animate-fade-in">
            <div className="user-dash__section-header">
              <span className="section-tag">About COEP मित्र</span>
            </div>
            <div className="card ud-wellness-card">
              <h2 className="ud-wellness__title">{wellnessInfo.title}</h2>
              <p className="ud-wellness__desc">{wellnessInfo.description}</p>
              {wellnessInfo.vision && (
                <div className="ud-wellness__vision">
                  <strong>Our Vision</strong>
                  <p>{wellnessInfo.vision}</p>
                </div>
              )}
              {wellnessInfo.services?.length > 0 && (
                <div className="ud-wellness__services">
                  <strong>Our Services</strong>
                  <div className="ud-wellness__services-grid">
                    {wellnessInfo.services.map((s, i) => (
                      <div key={i} className="ud-service-item">
                        <div className="ud-service-item__title">{s.title}</div>
                        {s.description && <div className="ud-service-item__desc">{s.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Today's Challenge ── */}
        <section className="user-dash__section">
          <div className="user-dash__section-header">
            <span className="section-tag">30-Day Challenge</span>
            <Link to="/challenge" className="user-dash__see-all">View details →</Link>
          </div>
          {challengeLoading ? (
            <div className="ud-loading">Loading today's task…</div>
          ) : !activeTask ? (
            <div className="ud-empty-state"><p>No active challenge task. Check back soon.</p></div>
          ) : (
            <div className={`challenge-today card ${isDone ? 'challenge-today--done' : ''}`}>
              <div className="challenge-today__top">
                <div className="challenge-today__day-badge">Day {activeDay}</div>
                {isDone && <div className="challenge-today__check">Completed</div>}
              </div>
              <h2 className="challenge-today__title">{activeTask.title}</h2>
              <p className="challenge-today__desc">{activeTask.description}</p>
              {activeTask.instructions && (
                <div className="challenge-today__instructions">
                  <strong>Instructions</strong>
                  <p>{activeTask.instructions}</p>
                </div>
              )}
              {!isDone && (
                <div className="challenge-today__inputs">
                  {!reflMode ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setReflMode(true); setReflText(challengeProgress.reflections[activeDay] || ''); }}>
                      {hasRefl ? 'Edit Reflection' : 'Write Reflection'}
                    </button>
                  ) : (
                    <div className="challenge-today__refl-box animate-fade-in">
                      <textarea className="form-input" placeholder="How did this feel? What did you notice?" value={reflText} onChange={e => setReflText(e.target.value)} rows={3} autoFocus />
                      
                      <div className="challenge-today__upload-row">
                        <label className="challenge-today__upload-label" htmlFor="ud-task-img">
                          {imagePreview ? '📷 Image selected' : '📁 Add an image (optional)'}
                        </label>
                        <input id="ud-task-img" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                        {imagePreview && (
                          <div className="challenge-today__img-preview-wrap">
                            <img src={imagePreview} alt="Preview" className="challenge-today__img-preview" />
                            <button className="btn-close-mini" onClick={() => setImagePreview(null)}>✕</button>
                          </div>
                        )}
                      </div>

                      <div className="challenge-today__refl-actions">
                        <button className="btn btn-mint btn-sm" onClick={handleSaveRefl}>Save Reflection</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setReflMode(false); setImagePreview(null); }}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {hasRefl && !reflMode && (
                    <div className="challenge-today__refl-preview">
                      <em>{challengeProgress.reflections[activeDay].slice(0, 120)}{challengeProgress.reflections[activeDay].length > 120 ? '…' : ''}</em>
                    </div>
                  )}
                </div>
              )}
              <div className="challenge-today__footer">
                <button id="mark-done-btn" className={`btn ${isDone ? 'btn-mint' : 'btn-primary'}`} onClick={() => markDone(activeDay)} disabled={isDone}>
                  {isDone ? 'Completed' : 'Mark as Done'}
                </button>
                <span className="challenge-today__progress-text">
                  {streak > 0 ? `${streak}-day streak` : 'Start your streak today'}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ── Events ── */}
        <section className="user-dash__section">
          <div className="user-dash__section-header">
            <span className="section-tag">Upcoming Events</span>
            <Link to="/events" className="user-dash__see-all">See all →</Link>
          </div>
          {eventsLoading ? <div className="ud-loading">Loading events…</div>
          : events.length === 0 ? <div className="user-dash__empty"><p>No events scheduled yet.</p></div>
          : (
            <div className="user-dash__events-grid">
              {events.slice(0, 3).map(ev => {
                const days = getDaysUntil(ev.date);
                return (
                  <div key={ev._id || ev.id} className="ud-event-card card">
                    {ev.imageUrl ? <img src={ev.imageUrl} alt={ev.title} className="ud-event-card__img" /> : (
                      <div className={`ud-event-card__placeholder placeholder--${ev.category === 'Workshop' ? 'blue' : ev.category === 'Awareness' ? 'lavender' : 'mint'}`} />
                    )}
                    <div className="ud-event-card__body">
                      <span className={`badge badge-${ev.category === 'Workshop' ? 'blue' : ev.category === 'Awareness' ? 'lavender' : 'mint'}`}>{ev.category}</span>
                      <h3 className="ud-event-card__title">{ev.title}</h3>
                      {ev.description && <p className="ud-event-card__desc">{ev.description.slice(0, 70)}{ev.description.length > 70 ? '…' : ''}</p>}
                      <div className="ud-event-card__meta">
                        <span>{formatDate(ev.date)}</span>
                        {days === 0 ? <span className="ud-event-card__today">Today</span>
                          : <span className="ud-event-card__days"><strong>{days}</strong> days away</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Event Reports ── */}
        <section className="user-dash__section">
          <div className="user-dash__section-header">
            <span className="section-tag">Past Activities &amp; Reports</span>
          </div>
          {reportsLoading ? <div className="ud-loading">Loading reports…</div>
          : eventReports.length === 0 ? <div className="user-dash__empty"><p>No reports published yet.</p></div>
          : (
            <div className="ud-reports-list">
              {eventReports.slice(0, 5).map(r => (
                <div key={r._id} className="ud-report-card card">
                  <div className="ud-report-card__header" onClick={() => setExpandReport(expandReport === r._id ? null : r._id)}>
                    <div>
                      <div className="ud-report-card__title">{r.title}</div>
                      <div className="ud-report-card__date">{formatDate(r.date)}</div>
                    </div>
                    <span className="ud-report-card__chevron" style={{ transform: expandReport === r._id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▼</span>
                  </div>
                  {expandReport === r._id && (
                    <div className="ud-report-card__body animate-fade-in">
                      <p>{r.summary}</p>
                      {r.fileUrl && <a href={r.fileUrl} target="_blank" rel="noreferrer" className="ud-report-card__link">Download Report</a>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Reflection Journal ── */}
        <section className="user-dash__section">
          <div className="user-dash__refl-banner card glass-lavender">
            <div className="user-dash__refl-banner-content">
              <div className="user-dash__refl-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div>
                <h3 className="user-dash__refl-title">Reflection Journal</h3>
                <p className="user-dash__refl-sub">A private space for your thoughts. Write freely, without judgment.</p>
              </div>
            </div>
            <Link to="/reflect" id="go-to-reflect-btn" className="btn btn-primary btn-sm">Open Journal</Link>
          </div>
        </section>

      </div>
    </div>
  );
}
