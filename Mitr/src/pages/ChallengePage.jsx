import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { challengeAPI } from '../api';
import './ChallengePage.css';

export default function ChallengePage() {
  const { challenges, challengeLoading, joinChallenge, completeTask, submitTaskFeedback } = useApp();
  
  const [view, setView] = useState('discover'); // 'discover', 'details'
  const [selectedId, setSelectedId] = useState(null);
  
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Feedback form state
  const [feedbackTask, setFeedbackTask] = useState(null);
  const [mood, setMood] = useState('Good');
  const [feedbackText, setFeedbackText] = useState('');

  const loadChallengeDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const data = await challengeAPI.getById(id);
      setDetails(data);
    } catch (err) {
      alert('Could not load challenge details');
      setView('discover');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSelectChallenge = (id) => {
    setSelectedId(id);
    setView('details');
    loadChallengeDetails(id);
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await joinChallenge(selectedId);
      await loadChallengeDetails(selectedId);
    } catch (err) {
      alert(err.message || 'Could not join challenge');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (taskId) => {
    setActionLoading(true);
    try {
      await completeTask(selectedId, taskId);
      await loadChallengeDetails(selectedId);
      setFeedbackTask(taskId); // Open feedback form after completion
    } catch (err) {
      alert(err.message || 'Could not complete task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async (taskId) => {
    setActionLoading(true);
    try {
      await submitTaskFeedback(selectedId, taskId, { mood, text: feedbackText });
      setFeedbackTask(null);
      setMood('Good');
      setFeedbackText('');
      alert('Feedback saved!');
    } catch (err) {
      alert(err.message || 'Could not submit feedback');
    } finally {
      setActionLoading(false);
    }
  };

  if (view === 'discover') {
    return (
      <div className="challenge-page">
        <div className="challenge-header">
          <div className="container">
            <span className="section-tag">Well-being Journeys</span>
            <h1 className="section-title">Discover Challenges</h1>
            <div className="divider" />
            <p className="section-subtitle">
              Commit to small, daily actions. Build habits that support your mental and emotional well-being.
            </p>
          </div>
        </div>

        <section className="section container">
          {challengeLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading challenges…</p>
          ) : challenges.length === 0 ? (
            <div className="events-empty">
              <p>No challenges available right now. Check back soon!</p>
            </div>
          ) : (
            <div className="events-grid grid-responsive">
              {challenges.map(c => (
                <div key={c._id} className="card event-card">
                  <div className={`event-card__placeholder event-card__placeholder--challenge`} />
                  <div className="event-card__body">
                    <div className="event-card__top">
                      <span className="badge badge-lavender">{c.category}</span>
                      <span className="countdown-days"><strong>{c.duration}</strong> days</span>
                    </div>
                    <h3 className="event-card__title">{c.title}</h3>
                    <p className="event-card__desc">{c.description}</p>
                    <button className="btn btn-primary" onClick={() => handleSelectChallenge(c._id)} style={{ marginTop: '1rem' }}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // Details View
  if (detailsLoading || !details) {
    return (
      <div className="challenge-page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading challenge details…</p>
        </div>
      </div>
    );
  }

  const { challenge, tasks, participation, completions } = details;
  const isJoined = !!participation;
  const progressPercent = participation ? Math.round((participation.progress / challenge.duration) * 100) : 0;

  return (
    <div className="challenge-page">
      <div className="challenge-header">
        <div className="container">
          <button className="btn btn-secondary btn-sm" onClick={() => setView('discover')} style={{ marginBottom: '1.5rem' }}>
            ← Back to Discover
          </button>
          <span className="section-tag">{challenge.category}</span>
          <h1 className="section-title">{challenge.title}</h1>
          <div className="divider" />
          <p className="section-subtitle">{challenge.description}</p>

          {isJoined ? (
            <div className="challenge-progress glass" style={{ marginTop: '2rem' }}>
              <div className="challenge-progress__info">
                <div>
                  <div className="challenge-progress__label">Your Progress</div>
                  <div className="challenge-progress__stat">
                    <span className="challenge-progress__num">{participation.progress}</span>
                    <span className="challenge-progress__den"> / {challenge.duration} tasks</span>
                  </div>
                </div>
              </div>
              <div className="challenge-progress__bar-wrap">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="challenge-progress__percent">{progressPercent}% complete</span>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '2rem' }}>
              <button className="btn btn-mint" onClick={handleJoin} disabled={actionLoading}>
                {actionLoading ? 'Joining...' : 'Join this Challenge'}
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="section container">
        <h2 style={{ marginBottom: '1.5rem' }}>Challenge Tasks</h2>
        {!isJoined && <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Join the challenge to mark tasks as complete and track your progress.</p>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tasks.map(t => {
            const isCompleted = completions?.some(c => c.taskId === t._id);
            return (
              <div key={t._id} className={`day-card card ${isCompleted ? 'day-card--done' : ''}`} style={{ width: '100%' }}>
                <div className="day-card__head">
                  <div className="day-card__number">Day {t.dayNumber}</div>
                  {isCompleted && <div className="day-card__check">Completed</div>}
                </div>
                <h3 className="day-card__title" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{t.title}</h3>
                <p className="day-card__desc" style={{ marginBottom: '1rem' }}>{t.description}</p>
                {t.instructions && (
                  <div className="challenge-instructions-box" style={{ marginBottom: '1rem' }}>
                    <strong>What to do:</strong>
                    <p>{t.instructions}</p>
                  </div>
                )}
                
                {isJoined && !isCompleted && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleComplete(t._id)} disabled={actionLoading}>
                    Mark as Done
                  </button>
                )}

                {/* Feedback Form */}
                {feedbackTask === t._id && (
                  <div className="day-card__refl-box animate-fade-in" style={{ marginTop: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>How did you feel after completing this?</h4>
                    <select className="form-input" value={mood} onChange={e => setMood(e.target.value)} style={{ marginBottom: '1rem' }}>
                      <option>Great</option><option>Good</option><option>Okay</option><option>Difficult</option><option>Not helpful</option>
                    </select>
                    <textarea
                      className="form-input day-card__textarea"
                      placeholder="Add an optional reflection..."
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      rows={3}
                    />
                    <div className="day-card__refl-actions">
                      <button className="btn btn-mint btn-sm" onClick={() => handleSubmitFeedback(t._id)} disabled={actionLoading}>Submit Feedback</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setFeedbackTask(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {isCompleted && feedbackTask !== t._id && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setFeedbackTask(t._id)} style={{ marginTop: '1rem' }}>
                    Add / Edit Feedback
                  </button>
                )}
              </div>
            );
          })}
          {tasks.length === 0 && <p>Tasks are being added to this challenge. Check back later.</p>}
        </div>
      </section>
    </div>
  );
}
