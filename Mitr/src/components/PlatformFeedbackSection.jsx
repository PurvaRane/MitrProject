import React, { useState, useEffect } from 'react';
import { feedbackAPI } from '../api';
import './PlatformFeedbackSection.css';

const FEEDBACK_TYPES = [
  'General Feedback',
  'Activity Suggestion',
  'Event Suggestion',
  'Platform Improvement',
  'Support Feedback',
  'Other',
];

export default function PlatformFeedbackSection({ title = 'Share Your Feedback', subtitle }) {
  const [type, setType] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [myFeedback, setMyFeedback] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchMyHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await feedbackAPI.getMy();
      if (res.success) {
        setMyFeedback(res.feedback || []);
      }
    } catch (err) {
      console.error('Failed to load feedback history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await feedbackAPI.submit({
        type,
        message: message.trim(),
        isAnonymous,
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Thank you for your feedback!');
        setMessage('');
        setType('General Feedback');
        setIsAnonymous(false);
        // Refresh history if open
        if (showHistory) fetchMyHistory();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory && myFeedback.length === 0) {
      fetchMyHistory();
    }
    setShowHistory(!showHistory);
  };

  return (
    <section className="feedback-section card glass">
      <div className="feedback-section__header">
        <div>
          <span className="section-tag">Community & Continuous Improvement</span>
          <h2 className="feedback-section__title">{title}</h2>
          <p className="feedback-section__subtitle">
            {subtitle || 'Your suggestions, event ideas, and experiences guide how we enhance mental health and wellbeing at COEP.'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleToggleHistory}
        >
          {showHistory ? 'Hide My Submissions' : 'My Previous Feedback'}
        </button>
      </div>

      {successMsg && (
        <div className="feedback-alert feedback-alert--success">
          <span>✓</span> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="feedback-alert feedback-alert--error">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="feedback-form__row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="feedback-type">
              Feedback Category
            </label>
            <select
              id="feedback-type"
              className="form-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={submitting}
            >
              {FEEDBACK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ alignSelf: 'flex-end', paddingBottom: '8px' }}>
            <label className="feedback-checkbox-label">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                disabled={submitting}
              />
              <span>Submit as anonymous to admins</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="feedback-message">
            Your Suggestion or Feedback <span style={{ color: 'var(--red-light, #e53e3e)' }}>*</span>
          </label>
          <textarea
            id="feedback-message"
            className="form-input feedback-textarea"
            rows="4"
            placeholder="Share your thoughts, suggestions for workshops, digital wellness tools, or campus support experience..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            maxLength={3000}
            required
          />
          <div className="feedback-char-count">
            {message.length} / 3000 characters
          </div>
        </div>

        <div className="feedback-form__actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !message.trim()}
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </div>
      </form>

      {/* Previous Submissions Accordion/List */}
      {showHistory && (
        <div className="feedback-history animate-fade-in">
          <h3 className="feedback-history__title">My Submitted Feedback</h3>
          {loadingHistory ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading previous feedback…</p>
          ) : myFeedback.length === 0 ? (
            <div className="feedback-history__empty">
              <p>You haven't submitted any feedback yet.</p>
            </div>
          ) : (
            <div className="feedback-history__list">
              {myFeedback.map((item) => (
                <div key={item._id} className="feedback-history__item">
                  <div className="feedback-history__item-top">
                    <span className="badge badge-blue">{item.type}</span>
                    <span className={`badge badge-${item.status === 'Reviewed' ? 'mint' : 'lavender'}`}>
                      {item.status}
                    </span>
                    <span className="feedback-history__date">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="feedback-history__message">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
