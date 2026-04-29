import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './ReflectionPage.css';

const PROMPTS = [
  'What made me smile today?',
  'What am I grateful for right now?',
  'What emotion is most present for me today, and why?',
  'What\'s one thing I did for myself today?',
  'What would I tell a struggling friend right now?',
  'What am I learning about myself through my challenges?',
  'What brought me peace today, even for a moment?',
];

function formatDateFull(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function ReflectionPage() {
  const { journalEntries, journalLoading, addJournalEntry, removeJournalEntry } = useApp();
  const [form, setForm] = useState({ title: '', body: '', mood: 'none', isAnonymous: false });
  const [promptIdx, setPromptIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [viewEntry, setViewEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPromptIdx(i => (i + 1) % PROMPTS.length), 8000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.body.trim()) return;
    setLoading(true);
    try {
      await addJournalEntry({
        title: form.title.trim() || 'Untitled Entry',
        body: form.body.trim(),
        mood: form.mood,
        isAnonymous: form.isAnonymous,
      });
      setForm({ title: '', body: '', mood: 'none', isAnonymous: false });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save entry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry permanently?')) return;
    try {
      await removeJournalEntry(id);
      if (viewEntry?._id === id) setViewEntry(null);
    } catch (err) {
      alert('Failed to delete entry: ' + err.message);
    }
  };

  const filtered = journalEntries.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.body.toLowerCase().includes(search.toLowerCase())
  );

  const MOODS = [
    { v: 'happy',   e: '😊', label: 'Happy'   },
    { v: 'calm',    e: '😌', label: 'Calm'    },
    { v: 'anxious', e: '😰', label: 'Anxious' },
    { v: 'sad',     e: '😔', label: 'Sad'     },
    { v: 'tired',   e: '😴', label: 'Tired'   },
    { v: 'excited', e: '🤩', label: 'Excited' },
  ];

  return (
    <div className="reflection-page">
      {/* Header */}
      <div className="reflection-header">
        <div className="container">
          <span className="section-tag">Personal Journal</span>
          <h1 className="section-title">COEP मित्र Reflection Portal</h1>
          <div className="divider" />
          <p className="section-subtitle">
            A private space for your thoughts. Persistent, secure, and confidential.
          </p>
        </div>
      </div>

      <div className="container reflection-layout section">

        {/* Compose */}
        <div className="refl-compose card">
          <div className="refl-prompt glass-blue">
            <span className="refl-prompt__icon">💭</span>
            <span key={promptIdx} className="refl-prompt__text affirmation-text">{PROMPTS[promptIdx]}</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="refl-title">Entry Title (optional)</label>
              <input
                id="refl-title"
                className="form-input"
                placeholder="Give today's entry a name…"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">How are you feeling right now?</label>
              <div className="refl-mood-grid" role="group" aria-label="Mood selector">
                {MOODS.map(m => (
                  <button
                    key={m.v}
                    type="button"
                    className={`refl-mood-btn ${form.mood === m.v ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, mood: m.v }))}
                    aria-pressed={form.mood === m.v}
                    disabled={loading}
                  >
                    <span>{m.e}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="refl-body">Your Reflection</label>
              <textarea
                id="refl-body"
                className="form-input refl-textarea"
                placeholder="Pour your thoughts here… this is a safe place."
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={6}
                required
                disabled={loading}
              />
            </div>

            <div className="refl-compose__footer">
              <label className="refl-anon-toggle">
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                  disabled={loading}
                />
                <span>Save anonymously</span>
              </label>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </form>

          {saved && (
            <div className="refl-saved-toast animate-bounce-in">
              Entry saved to your private journal.
            </div>
          )}
        </div>

        {/* Entries list */}
        <div className="refl-entries">
          <div className="refl-entries__header">
            <h2 className="refl-entries__title">My Journal ({journalEntries.length})</h2>
            <div className="refl-search-wrap">
              <input
                className="refl-search"
                placeholder="Search entries…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {journalLoading ? (
            <div className="refl-loading">Loading your entries…</div>
          ) : filtered.length === 0 ? (
            <div className="refl-empty">
              <p>{journalEntries.length === 0 ? 'Your journal awaits its first entry.' : 'No entries found.'}</p>
            </div>
          ) : (
            <div className="refl-list">
              {filtered.map(entry => (
                <div
                  key={entry._id}
                  className={`refl-entry-card card ${viewEntry?._id === entry._id ? 'refl-entry-card--open' : ''}`}
                  onClick={() => setViewEntry(viewEntry?._id === entry._id ? null : entry)}
                >
                  <div className="refl-entry-card__top">
                    <div className="refl-entry-card__left">
                      {entry.mood !== 'none' && (
                        <span className="refl-entry-card__mood">
                          {MOODS.find(m => m.v === entry.mood)?.e}
                        </span>
                      )}
                      <div>
                        <div className="refl-entry-card__title">{entry.isAnonymous ? 'Anonymous Entry' : entry.title}</div>
                        <div className="refl-entry-card__date">
                          {formatDateFull(entry.createdAt)} · {formatTime(entry.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="refl-entry-card__actions" onClick={e => e.stopPropagation()}>
                      <button
                        className="refl-delete-btn"
                        onClick={() => handleDelete(entry._id)}
                        aria-label="Delete entry"
                        title="Delete"
                      >✕</button>
                    </div>
                  </div>

                  {viewEntry?._id === entry._id && (
                    <div className="refl-entry-card__body animate-fade-in">
                      {entry.mood !== 'none' && (
                        <div className="refl-entry-card__mood-badge">
                          Feeling: {MOODS.find(m => m.v === entry.mood)?.e} {MOODS.find(m => m.v === entry.mood)?.label}
                        </div>
                      )}
                      <p className="refl-entry-card__text">{entry.body}</p>
                    </div>
                  )}

                  {viewEntry?._id !== entry._id && (
                    <p className="refl-entry-card__preview">{entry.body.slice(0, 100)}{entry.body.length > 100 ? '…' : ''}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
