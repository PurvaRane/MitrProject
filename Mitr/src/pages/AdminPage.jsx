import React, { useState } from 'react';
import './AdminPage.css';

const INIT_EVENTS = [
  { id: 1, title: 'Mindfulness Workshop', date: '2026-05-10', type: 'Workshops', participants: 0 },
  { id: 2, title: 'Open Mic Night',       date: '2026-05-18', type: 'Awareness',  participants: 0 },
];

const INIT_TASKS = [
  { id: 1, day: 1, title: 'Morning Gratitude', active: true  },
  { id: 2, day: 2, title: '5-Min Breathing',   active: true  },
  { id: 3, day: 3, title: 'Reach Out',          active: false },
];

const STATS = [
  { label: 'Active Users',       val: '1,247', icon: '👤', color: 'blue' },
  { label: 'Challenge Completions', val: '342',  icon: '✅', color: 'mint' },
  { label: 'Reflections Written',   val: '2,891', icon: '📝', color: 'lavender' },
  { label: 'Events Registered',     val: '489',  icon: '📅', color: 'peach' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  const [events, setEvents] = useState(INIT_EVENTS);
  const [tasks, setTasks] = useState(INIT_TASKS);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'Workshops' });
  const [newTask,  setNewTask]  = useState({ day: '', title: '' });
  const [savedMsg, setSavedMsg] = useState('');

  const showSaved = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const addEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    setEvents(ev => [...ev, { ...newEvent, id: Date.now(), participants: 0 }]);
    setNewEvent({ title: '', date: '', type: 'Workshops' });
    showSaved('✅ Event added successfully!');
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.day || !newTask.title) return;
    setTasks(t => [...t, { ...newTask, id: Date.now(), active: true }]);
    setNewTask({ day: '', title: '' });
    showSaved('✅ Challenge task added!');
  };

  const removeEvent = (id) => setEvents(ev => ev.filter(e => e.id !== id));
  const removeTask  = (id) => setTasks(t  => t.filter(t => t.id !== id));
  const toggleTask  = (id) => setTasks(t  => t.map(t => t.id === id ? { ...t, active: !t.active } : t));

  const TABS = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'events',   label: '📅 Events'   },
    { key: 'tasks',    label: '🌱 Tasks'    },
  ];

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="container">
          <span className="section-tag">Admin Panel</span>
          <h1 className="admin-header__title">COEP Mitra — Administration</h1>
          <p className="admin-header__sub">Manage events, challenge tasks, and track wellbeing participation.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs container">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`admin-tab ${tab === t.key ? 'admin-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Saved toast */}
      {savedMsg && (
        <div className="admin-toast animate-bounce-in">
          {savedMsg}
        </div>
      )}

      {/* Overview */}
      {tab === 'overview' && (
        <section className="section container">
          <h2 className="admin-section-title">Participation Overview</h2>
          <div className="admin-stats-grid">
            {STATS.map(s => (
              <div key={s.label} className={`admin-stat-card card admin-stat-card--${s.color}`}>
                <div className="admin-stat-card__icon">{s.icon}</div>
                <div className="admin-stat-card__val">{s.val}</div>
                <div className="admin-stat-card__label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="admin-chart-area card" style={{ marginTop: 'var(--space-xl)' }}>
            <h3 className="admin-section-title" style={{ marginBottom: 'var(--space-lg)' }}>
              Weekly Engagement
            </h3>
            <div className="admin-bar-chart">
              {[
                { day: 'Mon', val: 65 },
                { day: 'Tue', val: 80 },
                { day: 'Wed', val: 55 },
                { day: 'Thu', val: 92 },
                { day: 'Fri', val: 74 },
                { day: 'Sat', val: 48 },
                { day: 'Sun', val: 30 },
              ].map(b => (
                <div key={b.day} className="admin-bar-item">
                  <div className="admin-bar-item__bar-wrap">
                    <div className="admin-bar-item__bar" style={{ height: `${b.val}%` }}>
                      <span className="admin-bar-item__val">{b.val}</span>
                    </div>
                  </div>
                  <span className="admin-bar-item__label">{b.day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Events */}
      {tab === 'events' && (
        <section className="section container">
          <div className="admin-two-col">
            <div>
              <h2 className="admin-section-title">Add New Event</h2>
              <form className="admin-form card" onSubmit={addEvent}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ev-title">Event Title</label>
                  <input
                    id="ev-title"
                    className="form-input"
                    placeholder="e.g. Mindfulness Workshop"
                    value={newEvent.title}
                    onChange={e => setNewEvent(v => ({ ...v, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ev-date">Date</label>
                  <input
                    id="ev-date"
                    className="form-input"
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent(v => ({ ...v, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ev-type">Category</label>
                  <select
                    id="ev-type"
                    className="form-input"
                    value={newEvent.type}
                    onChange={e => setNewEvent(v => ({ ...v, type: e.target.value }))}
                  >
                    <option value="Workshops">Workshops</option>
                    <option value="Awareness">Awareness</option>
                    <option value="Challenges">Challenges</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">➕ Add Event</button>
              </form>
            </div>

            <div>
              <h2 className="admin-section-title">Current Events</h2>
              <div className="admin-list">
                {events.map(ev => (
                  <div key={ev.id} className="admin-list-item card">
                    <div>
                      <div className="admin-list-item__title">{ev.title}</div>
                      <div className="admin-list-item__sub">
                        <span className={`badge ${ev.type === 'Workshops' ? 'badge-blue' : ev.type === 'Awareness' ? 'badge-lavender' : 'badge-mint'}`}>{ev.type}</span>
                        <span>{ev.date}</span>
                        <span>👥 {ev.participants} registered</span>
                      </div>
                    </div>
                    <button className="admin-delete-btn" onClick={() => removeEvent(ev.id)} aria-label="Delete event">🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tasks */}
      {tab === 'tasks' && (
        <section className="section container">
          <div className="admin-two-col">
            <div>
              <h2 className="admin-section-title">Add Challenge Task</h2>
              <form className="admin-form card" onSubmit={addTask}>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-day">Day Number (1–30)</label>
                  <input
                    id="task-day"
                    className="form-input"
                    type="number"
                    min="1" max="30"
                    placeholder="e.g. 5"
                    value={newTask.day}
                    onChange={e => setNewTask(v => ({ ...v, day: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-title">Task Title</label>
                  <input
                    id="task-title"
                    className="form-input"
                    placeholder="e.g. Mindful Morning"
                    value={newTask.title}
                    onChange={e => setNewTask(v => ({ ...v, title: e.target.value }))}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-mint">➕ Add Task</button>
              </form>
            </div>

            <div>
              <h2 className="admin-section-title">Challenge Tasks</h2>
              <div className="admin-list">
                {tasks.map(task => (
                  <div key={task.id} className={`admin-list-item card ${!task.active ? 'admin-list-item--inactive' : ''}`}>
                    <div>
                      <div className="admin-list-item__title">Day {task.day}: {task.title}</div>
                      <div className="admin-list-item__sub">
                        <span className={`badge ${task.active ? 'badge-mint' : 'badge-peach'}`}>
                          {task.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="admin-list-item__actions">
                      <button
                        className={`btn btn-sm ${task.active ? 'btn-secondary' : 'btn-mint'}`}
                        onClick={() => toggleTask(task.id)}
                      >
                        {task.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="admin-delete-btn" onClick={() => removeTask(task.id)} aria-label="Delete task">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
