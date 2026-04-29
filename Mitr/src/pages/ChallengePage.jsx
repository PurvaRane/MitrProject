import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './ChallengePage.css';

const ENCOURAGEMENTS = [
  'Small steps matter.',
  'Every day counts.',
  'Progress, not perfection.',
  'Be patient with yourself.',
  'Growth is gradual.',
];

export default function ChallengePage() {
  const {
    activeTask, activeDay, challengeLoading,
    challengeProgress, markDone, saveReflection,
  } = useApp();

  const [reflText,     setReflText]     = useState('');
  const [reflMode,     setReflMode]     = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [enc,          setEnc]          = useState(0);

  const isDone    = !!challengeProgress.done[activeDay];
  const hasRefl   = !!challengeProgress.reflections[activeDay];
  const doneCount = challengeProgress.doneCount ?? 0;
  const progress  = Math.round((doneCount / 30) * 100);

  useEffect(() => {
    setReflText(challengeProgress.reflections[activeDay] || '');
    setReflMode(false);
    setImagePreview(null);
  }, [activeDay, challengeProgress.reflections]);

  useEffect(() => {
    const timer = setInterval(() => setEnc(i => (i + 1) % ENCOURAGEMENTS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveRefl = () => {
    // We send imagePreview if it exists
    saveReflection(activeDay, reflText, imagePreview);
    setReflMode(false);
  };

  if (challengeLoading) {
    return (
      <div className="challenge-page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading today's challenge…</p>
        </div>
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="challenge-page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No challenge task active yet. Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="challenge-page">
      {/* Header */}
      <div className="challenge-header">
        <div className="container">
          <span className="section-tag">30-Day Program</span>
          <h1 className="section-title">Mental Health Challenge</h1>
          <div className="divider" />
          <p className="section-subtitle">
            One small act of self-care per day. Complete today's task, reflect on it, and grow.
          </p>

          {/* Progress */}
          <div className="challenge-progress glass">
            <div className="challenge-progress__info">
              <div>
                <div className="challenge-progress__label">Your Progress</div>
                <div className="challenge-progress__stat">
                  <span className="challenge-progress__num">{doneCount}</span>
                  <span className="challenge-progress__den"> / 30 days</span>
                </div>
              </div>
              <div className="challenge-progress__streak">
                {challengeProgress.streak > 0 ? `${challengeProgress.streak}-day streak` : 'Start your streak today'}
              </div>
              <div className="challenge-progress__enc">
                <span key={enc} className="affirmation-text">{ENCOURAGEMENTS[enc]}</span>
              </div>
            </div>
            <div className="challenge-progress__bar-wrap">
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="challenge-progress__percent">{progress}% complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Task — only active day */}
      <section className="section container">
        <div className="challenge-single-wrap">
          <div className="challenge-active-label">
            <span className="badge badge-lavender">Today's Task</span>
            <span className="challenge-active-day">Day {activeDay} of 30</span>
          </div>

          <div className={`day-card day-card--featured card ${isDone ? 'day-card--done' : ''}`}>
            <div className="day-card__head">
              <div className="day-card__number">Day {activeTask.day}</div>
              {isDone && <div className="day-card__check">Completed</div>}
            </div>

            <h2 className="day-card__title">{activeTask.title}</h2>
            <p className="day-card__desc">{activeTask.description}</p>

            {activeTask.instructions && (
              <div className="challenge-instructions-box">
                <strong>What to do:</strong>
                <p>{activeTask.instructions}</p>
              </div>
            )}

            {/* Reflection section */}
            {!reflMode ? (
              <>
                {hasRefl && (
                  <div className="day-card__refl-preview">
                    <em>{challengeProgress.reflections[activeDay]}</em>
                  </div>
                )}
                {!isDone && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setReflMode(true)}
                    style={{ marginTop: 'var(--space-md)' }}
                  >
                    {hasRefl ? 'Edit Reflection' : 'Write Reflection'}
                  </button>
                )}
              </>
            ) : (
              <div className="day-card__refl-box animate-fade-in">
                <textarea
                  className="form-input day-card__textarea"
                  placeholder="How did this feel? What did you notice?"
                  value={reflText}
                  onChange={e => setReflText(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <div className="day-card__upload-row">
                  <label className="day-card__upload-label" htmlFor="task-img-upload">
                    {imagePreview ? 'Image selected' : 'Upload an image (optional)'}
                  </label>
                  <input
                    id="task-img-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div className="day-card__img-preview-wrap">
                      <img src={imagePreview} alt="Uploaded" className="day-card__img-preview" />
                      <button className="btn-close-mini" onClick={() => setImagePreview(null)}>✕</button>
                    </div>
                  )}
                </div>
                <div className="day-card__refl-actions">
                  <button className="btn btn-mint btn-sm" onClick={handleSaveRefl}>Save Reflection</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setReflMode(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="day-card__actions">
              <button
                id="challenge-mark-done-btn"
                className={`btn ${isDone ? 'btn-mint' : 'btn-primary'}`}
                onClick={() => markDone(activeDay)}
                disabled={isDone}
              >
                {isDone ? 'Completed' : 'Mark as Done'}
              </button>
            </div>
          </div>

          {/* Locked future days notice */}
          <div className="challenge-locked-notice glass">
            <div className="challenge-locked-notice__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <strong>Future tasks are unlocked day by day</strong>
              <p>Each day's task is revealed by the Wellness Centre. Come back tomorrow for Day {Math.min(activeDay + 1, 30)}.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
