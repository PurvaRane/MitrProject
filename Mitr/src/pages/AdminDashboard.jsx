import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { useApp } from '../context/AppContext';
import { adminAPI, submissionsAPI, appointmentAPI, journalAPI, pastEventsAPI, teamAPI, platformContentAPI } from '../api';
import './AdminDashboard.css';
import './BookAppointment.css';
const TABS = ['Overview', 'Events', 'Past Events', 'Team', 'Platform Content', 'Appointments', 'Reports', 'Journeys', 'Wellness Centre', 'Submissions', 'Analytics'];
const CATEGORIES = ['Workshop', 'Awareness', 'Challenge', 'Seminar', 'Other'];

function formatDate(d) {
  if (!d) return '';
  // Handle plain YYYY-MM-DD strings without UTC midnight timezone shift
  const dateObj = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00') : new Date(d);
  return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { 
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
  });
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`admin-toast admin-toast--${type}`}>{msg}</div>;
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ setTab }) {
  const { events, eventReports } = useApp();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminAPI.getStats().then(d => setStats(d.stats)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="admin-stats-grid grid-responsive">
        {[
          { label: 'Total Registered Students', val: stats?.totalUsers ?? '—', color: 'blue' },
          { label: 'New Today', val: stats?.registrationsToday ?? '—', color: 'mint' },
          { label: 'New This Week', val: stats?.registrationsThisWeek ?? '—', color: 'lavender' },
          { label: 'Active Participants', val: stats?.activeUsersCount ?? '—', color: 'blue' },
          { label: "Today's Completions", val: stats?.todayCompletions ?? '—', color: 'mint' },
          { label: 'Total Reflections', val: stats?.totalReflections ?? '—', color: 'peach' },
        ].map(s => (
          <div key={s.label} className={`card admin-stat admin-stat--${s.color}`}>
            <div className="admin-stat__val">{s.val}</div>
            <div className="admin-stat__label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="admin-quick-actions grid-responsive">
        {[
          { icon: '📅', title: 'Manage Events', desc: 'Add, edit or delete events', tab: 'Events', color: 'blue' },
          { icon: '📸', title: 'Past Events', desc: 'Manage historical gallery', tab: 'Past Events', color: 'lavender' },
          { icon: '👥', title: 'Manage Team', desc: 'I-Care We-Care members', tab: 'Team', color: 'mint' },
          { icon: '📝', title: 'Platform Content', desc: 'Edit homepage text', tab: 'Platform Content', color: 'peach' },
          { icon: '📆', title: 'Appointments', desc: 'Manage slots & bookings', tab: 'Appointments', color: 'peach' },
          { icon: '📝', title: 'User Submissions', desc: 'View reflections & images', tab: 'Submissions', color: 'mint' },
          { icon: '🌱', title: 'Well-being Journeys', desc: 'Manage challenges & tasks', tab: 'Journeys', color: 'lavender' },
          { icon: '📊', title: 'View Analytics', desc: 'Monitor trends & engagement', tab: 'Analytics', color: 'peach' },
        ].map(q => (
          <div key={q.title} className="card admin-quick-card" onClick={() => setTab(q.tab)}>
            <div className={`admin-quick-card__icon admin-icon--${q.color}`}>{q.icon}</div>
            <div className="admin-quick-card__text">
              <strong>{q.title}</strong>
              <span>{q.desc}</span>
            </div>
            <span className="admin-quick-card__arrow">→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Events Tab ────────────────────────────────────────────────────────────────
function EventsTab() {
  const { events, eventsLoading, addEvent, removeEvent } = useApp();
  const [form, setForm] = useState({ title: '', description: '', date: '', category: 'Workshop', imageUrl: '', capacity: '', registrationRequired: false });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) { showToast('Title and date are required.', 'error'); return; }
    setLoading(true);
    try {
      await addEvent({ ...form, capacity: form.capacity ? parseInt(form.capacity) : null });
      setForm({ title: '', description: '', date: '', category: 'Workshop', imageUrl: '', capacity: '', registrationRequired: false });
      showToast('Event added successfully.');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await removeEvent(id); showToast('Event deleted.'); }
    catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="admin-two-col">
      <div className="admin-form-side">
        <h2 className="admin-section-title">Add New Event</h2>
        <div className="card">
          <form className="admin-form" onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="admin-check-label">
                <input type="checkbox" checked={form.registrationRequired} onChange={e => setForm(f => ({ ...f, registrationRequired: e.target.checked }))} />
                Requires Registration
              </label>
            </div>
            {form.registrationRequired && (
              <div className="form-group">
                <label className="form-label">Capacity (leave empty for unlimited)</label>
                <input className="form-input" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 50" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Image URL (optional)</label>
              <input className="form-input" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Add Event'}
            </button>
          </form>
        </div>
      </div>
      <div className="admin-list-side">
        <h2 className="admin-section-title">All Events ({events.length})</h2>
        {eventsLoading ? <div className="admin-loading">Loading…</div> : events.length === 0 ? (
          <div className="card admin-empty"><p>No events yet. Add one.</p></div>
        ) : (
          <div className="admin-event-list">
            {events.map(ev => (
              <div key={ev._id} className="card admin-event-item">
                <div className="admin-event-item__body">
                  <div className="admin-event-item__title">{ev.title}</div>
                  <div className="admin-event-item__meta">
                    <span className="badge badge-blue">{ev.category}</span>
                    <span>{formatDate(ev.date)}</span>
                  </div>
                  {ev.description && <div className="admin-event-item__desc">{ev.description.slice(0, 80)}{ev.description.length > 80 ? '…' : ''}</div>}
                  {ev.registrationRequired && (
                    <div className="admin-event-item__meta" style={{ marginTop: '8px' }}>
                      <span className="badge badge-lavender">Reg: Required</span>
                      {ev.capacity && <span className="badge badge-peach">Cap: {ev.capacity}</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="admin-delete-btn" onClick={() => handleDelete(ev._id || ev.id)} title="Delete">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Toast {...toast} />
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const { eventReports, reportsLoading, addEventReport, removeEventReport } = useApp();
  const [form, setForm] = useState({ title: '', date: '', summary: '', fileUrl: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.summary) { showToast('Title, date, and summary are required.', 'error'); return; }
    setLoading(true);
    try {
      await addEventReport({ title: form.title, date: form.date, summary: form.summary, fileUrl: form.fileUrl || null });
      setForm({ title: '', date: '', summary: '', fileUrl: '' });
      showToast('Report published.');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="admin-two-col">
      <div className="admin-form-side">
        <h2 className="admin-section-title">Add Event Report</h2>
        <div className="card">
          <form className="admin-form" onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Report Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Mental Health Awareness Week 2025" required />
            </div>
            <div className="form-group">
              <label className="form-label">Event Date *</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Summary *</label>
              <textarea className="form-input" rows={5} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Describe the event, outcomes, and highlights…" required />
            </div>
            <div className="form-group">
              <label className="form-label">Report File URL (PDF, optional)</label>
              <input className="form-input" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Publishing…' : 'Publish Report'}</button>
          </form>
        </div>
      </div>
      <div className="admin-list-side">
        <h2 className="admin-section-title">Published Reports ({eventReports.length})</h2>
        {reportsLoading ? <div className="admin-loading">Loading…</div> : eventReports.length === 0 ? (
          <div className="card admin-empty"><p>No reports yet.</p></div>
        ) : (
          <div className="admin-event-list">
            {eventReports.map(r => (
              <div key={r._id} className="card admin-event-item">
                <div className="admin-event-item__body">
                  <div className="admin-event-item__title">{r.title}</div>
                  <div className="admin-event-item__meta"><span>{formatDate(r.date)}</span></div>
                  <div className="admin-event-item__desc">{r.summary.slice(0, 100)}{r.summary.length > 100 ? '…' : ''}</div>
                  {r.fileUrl && <a href={r.fileUrl} target="_blank" rel="noreferrer" className="admin-report-link">View Report PDF</a>}
                </div>
                <button className="admin-delete-btn" onClick={async () => { if (window.confirm('Delete?')) { try { await removeEventReport(r._id); } catch (e) { alert(e.message); } } }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Toast {...toast} />
    </div>
  );
}

// ── Challenge Tab ─────────────────────────────────────────────────────────────
function ChallengeTab() {
  const { challenges, fetchAllChallenges } = useApp();
  const [view, setView] = useState('list'); // 'list', 'edit-challenge', 'tasks'
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  
  const [challengeForm, setChallengeForm] = useState({ title: '', description: '', category: 'Mental Well-being', duration: 7, startDate: '', endDate: '', status: 'Draft' });
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState({ dayNumber: '', title: '', description: '', instructions: '' });
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000); };

  const handleCreateOrUpdateChallenge = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { challengeAPI } = await import('../api');
      if (selectedChallenge) {
        await challengeAPI.update(selectedChallenge._id, challengeForm);
        showToast('Challenge updated.');
      } else {
        await challengeAPI.create(challengeForm);
        showToast('Challenge created.');
      }
      await fetchAllChallenges();
      setView('list');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const loadTasks = async (id) => {
    setLoading(true);
    try {
      const { challengeAPI } = await import('../api');
      const data = await challengeAPI.getById(id);
      setTasks(data.tasks || []);
    } catch (err) { showToast('Could not load tasks', 'error'); }
    finally { setLoading(false); }
  };

  const handleManageTasks = (c) => {
    setSelectedChallenge(c);
    setTaskForm({ dayNumber: '', title: '', description: '', instructions: '' });
    loadTasks(c._id);
    setView('tasks');
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { challengeAPI } = await import('../api');
      if (taskForm._id) {
        await challengeAPI.updateTask(selectedChallenge._id, taskForm._id, taskForm);
        showToast(`Task updated.`);
      } else {
        await challengeAPI.addTask(selectedChallenge._id, taskForm);
        showToast(`Task created.`);
      }
      await loadTasks(selectedChallenge._id);
      setTaskForm({ dayNumber: '', title: '', description: '', instructions: '' });
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteChallenge = async (id) => {
    if (!window.confirm('Delete this challenge?')) return;
    try {
      const { challengeAPI } = await import('../api');
      await challengeAPI.delete(id);
      showToast('Challenge deleted.');
      fetchAllChallenges();
    } catch (err) { showToast(err.message, 'error'); }
  };

  if (view === 'edit-challenge') {
    return (
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setView('list')} style={{ marginBottom: '1rem' }}>← Back</button>
        <h2 className="admin-section-title">{selectedChallenge ? 'Edit Challenge' : 'New Challenge'}</h2>
        <form className="admin-form" onSubmit={handleCreateOrUpdateChallenge}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={challengeForm.title} onChange={e => setChallengeForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-input" rows={3} value={challengeForm.description} onChange={e => setChallengeForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Duration (Days)</label>
              <input className="form-input" type="number" min="1" value={challengeForm.duration} onChange={e => setChallengeForm(f => ({ ...f, duration: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select className="form-input" value={challengeForm.status} onChange={e => setChallengeForm(f => ({ ...f, status: e.target.value }))}>
                <option>Draft</option><option>Published</option><option>Active</option><option>Completed</option><option>Archived</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Date *</label>
              <input className="form-input" type="date" value={challengeForm.startDate ? challengeForm.startDate.split('T')[0] : ''} onChange={e => setChallengeForm(f => ({ ...f, startDate: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">End Date *</label>
              <input className="form-input" type="date" value={challengeForm.endDate ? challengeForm.endDate.split('T')[0] : ''} onChange={e => setChallengeForm(f => ({ ...f, endDate: e.target.value }))} required />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Challenge'}</button>
        </form>
        <Toast {...toast} />
      </div>
    );
  }

  if (view === 'tasks') {
    return (
      <div className="admin-two-col">
        <div className="admin-form-side">
          <button className="btn btn-secondary btn-sm" onClick={() => setView('list')} style={{ marginBottom: '1rem' }}>← Back to Challenges</button>
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <h2 className="admin-section-title">{taskForm._id ? 'Edit Task' : 'Add New Task'}</h2>
            <form className="admin-form" onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label">Day Number *</label>
                <input className="form-input" type="number" min="1" value={taskForm.dayNumber} onChange={e => setTaskForm(f => ({ ...f, dayNumber: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={2} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Instructions (Optional)</label>
                <textarea className="form-input" rows={3} value={taskForm.instructions} onChange={e => setTaskForm(f => ({ ...f, instructions: e.target.value }))} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Task'}</button>
              {taskForm._id && <button className="btn btn-secondary" type="button" onClick={() => setTaskForm({ dayNumber: '', title: '', description: '', instructions: '' })} style={{ marginLeft: '1rem' }}>Cancel Edit</button>}
            </form>
          </div>
        </div>
        <div className="admin-list-side">
          <h2 className="admin-section-title">Tasks for {selectedChallenge.title}</h2>
          <div className="admin-event-list">
            {tasks.map(t => (
              <div key={t._id} className="card admin-event-item" onClick={() => setTaskForm(t)} style={{ cursor: 'pointer' }}>
                <div className="admin-event-item__body">
                  <div className="admin-event-item__title">Day {t.dayNumber}: {t.title}</div>
                  <div className="admin-event-item__desc">{t.description}</div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p>No tasks added yet.</p>}
          </div>
        </div>
        <Toast {...toast} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="admin-section-title">Manage Challenges</h2>
        <button className="btn btn-mint" onClick={() => { setSelectedChallenge(null); setChallengeForm({ title: '', description: '', category: 'Mental Well-being', duration: 7, startDate: '', endDate: '', status: 'Draft' }); setView('edit-challenge'); }}>+ New Challenge</button>
      </div>
      <div className="admin-event-list">
        {challenges.map(c => (
          <div key={c._id} className="card admin-event-item">
            <div className="admin-event-item__body">
              <div className="admin-event-item__title">{c.title}</div>
              <div className="admin-event-item__meta">
                <span className={`badge ${c.status === 'Active' ? 'badge-mint' : 'badge-lavender'}`}>{c.status}</span>
                <span>{c.duration} Days</span>
              </div>
              <div className="admin-event-item__desc">{c.description.slice(0, 80)}...</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-sm btn-primary" onClick={() => handleManageTasks(c)}>Tasks</button>
              <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedChallenge(c); setChallengeForm(c); setView('edit-challenge'); }}>Edit</button>
              <button className="admin-delete-btn" onClick={() => handleDeleteChallenge(c._id)}>✕</button>
            </div>
          </div>
        ))}
        {challenges.length === 0 && <div className="card admin-empty"><p>No challenges exist yet.</p></div>}
      </div>
      <Toast {...toast} />
    </div>
  );
}

// ── Wellness Tab ──────────────────────────────────────────────────────────────
function WellnessTab() {
  const { wellnessInfo, wellnessLoading, saveWellnessInfo } = useApp();
  const [form, setForm] = useState({ title: '', description: '', vision: '', services: [] });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [newSvc, setNewSvc] = useState({ title: '', description: '' });

  useEffect(() => {
    if (wellnessInfo) {
      setForm({ title: wellnessInfo.title || '', description: wellnessInfo.description || '', vision: wellnessInfo.vision || '', services: wellnessInfo.services || [] });
    }
  }, [wellnessInfo]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) { showToast('Title and description required.', 'error'); return; }
    setLoading(true);
    try {
      await saveWellnessInfo(form);
      showToast('Wellness info updated.');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const addService = () => {
    if (!newSvc.title) return;
    setForm(f => ({ ...f, services: [...f.services, { ...newSvc }] }));
    setNewSvc({ title: '', description: '' });
  };

  const removeService = (i) => setForm(f => ({ ...f, services: f.services.filter((_, idx) => idx !== i) }));

  if (wellnessLoading) return <div className="admin-loading">Loading…</div>;

  return (
    <div>
      <h2 className="admin-section-title">Wellness Centre Content</h2>
      <div className="card" style={{ padding: 'var(--space-xl)', maxWidth: 760 }}>
        <form className="admin-form" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Centre Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. COEP मित्र — Wellness Centre" required />
          </div>
          <div className="form-group">
            <label className="form-label">About / Description *</label>
            <textarea className="form-input" rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="About the wellness centre…" required />
          </div>
          <div className="form-group">
            <label className="form-label">Vision / Motto</label>
            <textarea className="form-input" rows={3} value={form.vision} onChange={e => setForm(f => ({ ...f, vision: e.target.value }))} placeholder="Our vision for student wellbeing…" />
          </div>
          <div className="form-group">
            <label className="form-label">Services Offered</label>
            {form.services.map((s, i) => (
              <div key={i} className="admin-service-row">
                <div><strong>{s.title}</strong> — {s.description}</div>
                <button type="button" className="admin-delete-btn" onClick={() => removeService(i)}>✕</button>
              </div>
            ))}
            <div className="admin-add-service">
              <input className="form-input" placeholder="Service title" value={newSvc.title} onChange={e => setNewSvc(s => ({ ...s, title: e.target.value }))} />
              <input className="form-input" placeholder="Service description" value={newSvc.description} onChange={e => setNewSvc(s => ({ ...s, description: e.target.value }))} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addService}>+ Add</button>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Wellness Info'}</button>
        </form>
      </div>
      <Toast {...toast} />
    </div>
  );
}

// ── Submissions Tab ───────────────────────────────────────────────────────────
function SubmissionsTab() {
  const [subTab, setSubTab] = useState('challenges'); // 'challenges' | 'journals'
  
  // Challenge Submissions State
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [filters, setFilters] = useState({ hasReflection: 'false', hasImage: 'false' });

  // Journals State
  const [journals, setJournals] = useState([]);
  const [journalsLoading, setJournalsLoading] = useState(true);

  // Fetch Challenge Submissions
  const fetchSubs = async () => {
    setSubsLoading(true);
    try {
      const activeFilters = {};
      if (filters.hasReflection === 'true') activeFilters.hasReflection = 'true';
      if (filters.hasImage === 'true') activeFilters.hasImage = 'true';
      
      const data = await submissionsAPI.getAll(activeFilters);
      setSubs(data.submissions || []);
    } catch (err) { console.error(err); }
    finally { setSubsLoading(false); }
  };

  // Fetch Journals
  const fetchJournals = async () => {
    setJournalsLoading(true);
    try {
      const res = await journalAPI.adminGetAll();
      setJournals(res.entries || []);
    } catch (err) { console.error(err); }
    finally { setJournalsLoading(false); }
  };

  useEffect(() => {
    if (subTab === 'challenges') fetchSubs();
    if (subTab === 'journals') fetchJournals();
  }, [subTab, filters]);

  return (
    <div>
      <div className="admin-submissions-header">
        <h2 className="admin-section-title">User Submissions & Reflections</h2>
      </div>
      
      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn btn-sm ${subTab === 'challenges' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('challenges')}
        >Challenge Submissions</button>
        <button
          className={`btn btn-sm ${subTab === 'journals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('journals')}
        >Personal Journals (Reflections)</button>
      </div>

      {subTab === 'challenges' && (
        <>
          <div className="admin-submissions-filters card">
            <div className="form-group">
              <label className="form-label">Filter Content</label>
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <label className="admin-check-label">
                  <input type="checkbox" checked={filters.hasReflection === 'true'} onChange={e => setFilters(f => ({ ...f, hasReflection: e.target.checked ? 'true' : 'false' }))} />
                  Has Reflection
                </label>
                <label className="admin-check-label">
                  <input type="checkbox" checked={filters.hasImage === 'true'} onChange={e => setFilters(f => ({ ...f, hasImage: e.target.checked ? 'true' : 'false' }))} />
                  Has Image
                </label>
              </div>
            </div>
          </div>

          {subsLoading ? <div className="admin-loading">Loading submissions…</div> : subs.length === 0 ? (
            <div className="card admin-empty"><p>No submissions found for these filters.</p></div>
          ) : (
            <div className="admin-subs-table-wrap card">
              <table className="admin-subs-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>MIS ID</th>
                    <th>Challenge / Task</th>
                    <th>Reflection</th>
                    <th>Image</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="admin-sub-user">
                          <strong>{s.userId?.name || 'Unknown'}</strong>
                          <span>{s.userId?.branch} ({s.userId?.year})</span>
                        </div>
                      </td>
                      <td>{s.userId?.misId || '—'}</td>
                      <td>
                        {s.challengeId ? (
                          <>
                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{s.challengeId.title}</div>
                            {s.taskId && <div className="text-muted" style={{ fontSize: '0.85rem' }}>Day {s.taskId.dayNumber}: {s.taskId.title}</div>}
                          </>
                        ) : (
                          <span className="badge badge-lavender">Challenge Submission</span>
                        )}
                      </td>
                      <td>
                        {s.reflectionText ? (
                          <div className="admin-sub-refl" title={s.reflectionText}>
                            {s.reflectionText.slice(0, 50)}{s.reflectionText.length > 50 ? '…' : ''}
                          </div>
                        ) : <span className="admin-none">No reflection</span>}
                      </td>
                      <td>
                        {s.imageUrl ? (
                          <a href={s.imageUrl} target="_blank" rel="noreferrer" className="admin-sub-img-link">
                            View Image
                          </a>
                        ) : <span className="admin-none">—</span>}
                      </td>
                      <td>{formatDateTime(s.submittedAt || s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {subTab === 'journals' && (
        <>
          {journalsLoading ? <div className="admin-loading">Loading journals…</div> : journals.length === 0 ? (
            <div className="card admin-empty"><p>No journal reflections found.</p></div>
          ) : (
            <div className="admin-subs-table-wrap card">
              <table className="admin-subs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>MIS ID</th>
                    <th>Mood</th>
                    <th>Reflection Title</th>
                    <th>Content</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map(j => {
                    const isAnon = j.isAnonymous;
                    return (
                      <tr key={j._id}>
                        <td>{formatDateTime(j.createdAt)}</td>
                        <td>
                          {isAnon ? (
                            <span className="badge badge-lavender">Anonymous</span>
                          ) : (
                            <div className="admin-sub-user">
                              <strong>{j.userId?.name || 'Unknown'}</strong>
                              <span>{j.userId?.branch} ({j.userId?.year})</span>
                            </div>
                          )}
                        </td>
                        <td>{isAnon ? '—' : (j.userId?.misId || '—')}</td>
                        <td>
                          {j.mood && j.mood !== 'none' ? (
                            <span className="admin-mood-badge">
                              {j.mood === 'happy' && '😊'}
                              {j.mood === 'sad' && '😔'}
                              {j.mood === 'stressed' && '😫'}
                              {j.mood === 'anxious' && '😰'}
                              {j.mood === 'motivated' && '🔥'}
                              {j.mood === 'calm' && '😌'}
                            </span>
                          ) : '—'}
                        </td>
                        <td><strong>{j.title}</strong></td>
                        <td>
                          <div className="admin-sub-refl" title={j.body}>
                            {j.body.slice(0, 80)}{j.body.length > 80 ? '…' : ''}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [stats, setStats] = useState(null);
  const [dayStats, setDayStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getStats(), adminAPI.getChallengeStats()])
      .then(([s, d]) => { setStats(s.stats); setDayStats(d.rows || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading analytics…</div>;
  if (!stats) return <div className="card admin-empty"><p>Could not load analytics.</p></div>;

  const maxWeekly = Math.max(...(stats.weeklyStats || []).map(w => w.count), 1);

  return (
    <div>
      <div className="admin-stats-grid grid-responsive" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'Active Users', val: stats.activeUsersCount, color: 'blue' },
          { label: 'Inactive Users', val: stats.inactiveUsersCount, color: 'peach' },
          { label: 'Avg Reflection Words', val: stats.avgWords, color: 'lavender' },
          { label: 'Total Reflections', val: stats.totalReflections, color: 'mint' },
        ].map(s => (
          <div key={s.label} className={`card admin-stat admin-stat--${s.color}`}>
            <div className="admin-stat__val">{s.val}</div>
            <div className="admin-stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-two-col">
        <div className="card admin-monitor">
          <h3 className="admin-section-title">Weekly Participation Trend</h3>
          <div className="admin-bar-chart">
            {(stats.weeklyStats || []).map(w => (
              <div key={w.date} className="admin-bar-item">
                <div className="admin-bar-wrap" style={{ height: 100 }}>
                  <div className="admin-bar" style={{ height: `${Math.round((w.count / maxWeekly) * 100)}%` }}>
                    <span className="admin-bar__val">{w.count}</span>
                  </div>
                </div>
                <span className="admin-bar__label">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card admin-monitor">
          <h3 className="admin-section-title">Per-Day Breakdown</h3>
          <div className="admin-stats-table-wrap">
            <table className="admin-stats-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Done</th>
                  <th>Refl</th>
                  <th>Img</th>
                  <th>Engagement</th>
                </tr>
              </thead>
              <tbody>
                {(stats.dayStats || []).map(r => (
                  <tr key={r.day}>
                    <td>Day {r.day}</td>
                    <td>{r.completions}</td>
                    <td>{r.reflections}</td>
                    <td>{r.images}</td>
                    <td>
                      <div className="admin-pct-bar">
                        <div className="admin-pct-fill" style={{ width: `${r.percentage}%` }} />
                        <span>{r.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Availability Calendar Sub-component ───────────────────────────────────────
function AvailabilityManager() {
  const [selDate, setSelDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthAvailability, setMonthAvailability] = useState({});

  // Slot generator state
  const [genStart, setGenStart] = useState('09:00');
  const [genEnd, setGenEnd]     = useState('17:00');
  const [genInterval, setGenInterval] = useState(30); // minutes
  const [genLoading, setGenLoading]   = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const fetchMonthAvailability = async (year, month) => {
    try {
      const res = await appointmentAPI.getAvailability(year, month);
      if (res.success) setMonthAvailability(res.availability);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMonthAvailability(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Load slots for the selected date
  const loadSlots = async (date) => {
    if (!date) return;
    setSlotsLoading(true);
    try {
      // Use month availability to get all slots (including booked ones)
      const [y, m] = date.split('-');
      const res = await appointmentAPI.getAvailability(parseInt(y), parseInt(m));
      const dayData = res.availability?.[date];
      setSlots(dayData?.slots || []);
    } catch (err) {
      showToast('Could not load slots: ' + err.message, 'error');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelDate(date);
    loadSlots(date);
  };

  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month - 1, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
    else { setCurrentMonth(m => m - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
    else { setCurrentMonth(m => m + 1); }
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const todayStr = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const grid = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= days; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = monthAvailability[dateStr];
      const isPast = dateStr < todayStr;
      
      let statusClass = 'unavailable';
      if (dayData && !isPast) {
        if (dayData.availableSlots > 0) statusClass = 'available';
        else if (dayData.bookedSlots > 0) statusClass = 'booked';
      }

      grid.push(
        <button
          key={d}
          className={`calendar-day ${statusClass} ${selDate === dateStr ? 'selected' : ''}`}
          disabled={isPast}
          onClick={() => handleDateChange(dateStr)}
        >
          <span className="calendar-day-num">{d}</span>
          {statusClass === 'available' && <span className="calendar-day-dots">●</span>}
        </button>
      );
    }
    return grid;
  };

  // Generate time slots from start to end with interval
  const generateTimeSlots = () => {
    const [sh, sm] = genStart.split(':').map(Number);
    const [eh, em] = genEnd.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;
    const interval  = Number(genInterval);
    const result = [];
    for (let m = startMins; m + interval <= endMins; m += interval) {
      const startH = String(Math.floor(m / 60)).padStart(2, '0');
      const startM = String(m % 60).padStart(2, '0');
      const endH   = String(Math.floor((m + interval) / 60)).padStart(2, '0');
      const endM   = String((m + interval) % 60).padStart(2, '0');
      result.push({ startTime: `${startH}:${startM}`, endTime: `${endH}:${endM}` });
    }
    return result;
  };

  const handleGenerate = async () => {
    if (!selDate) { showToast('Please select a date first.', 'error'); return; }
    const generated = generateTimeSlots();
    if (generated.length === 0) { showToast('No slots generated. Check start/end/interval.', 'error'); return; }
    setGenLoading(true);
    try {
      await appointmentAPI.adminSetAvailability({ date: selDate, slots: generated });
      showToast(`✅ ${generated.length} slot(s) added for ${selDate}.`);
      loadSlots(selDate);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenLoading(false);
    }
  };

  const handleRemoveSlot = async (startTime) => {
    if (!window.confirm(`Remove slot ${startTime} on ${selDate}?`)) return;
    try {
      await appointmentAPI.adminRemoveSlot({ date: selDate, startTime });
      showToast('Slot removed.');
      loadSlots(selDate);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleDay = async (isAvailable) => {
    if (!selDate) return;
    try {
      await appointmentAPI.adminToggleDay({ date: selDate, isAvailable });
      showToast(`All slots for ${selDate} ${isAvailable ? 'enabled' : 'disabled'}.`);
      loadSlots(selDate);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const today = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="avail-manager">
      <h3 className="admin-section-title" style={{ marginBottom: '1rem' }}>📅 Manage Availability Slots</h3>
      <div className="admin-two-col">
        {/* Left: Date selector + Slot generator */}
        <div className="admin-form-side">
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <div className="calendar-widget mb-xl" style={{ marginBottom: '1.5rem' }}>
              <div className="calendar-header">
                <button onClick={handlePrevMonth}>&lt;</button>
                <strong>{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][currentMonth - 1]} {currentYear}</strong>
                <button onClick={handleNextMonth}>&gt;</button>
              </div>
              <div className="calendar-weekdays">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>
              <div className="calendar-grid">
                {renderCalendar()}
              </div>
              <div className="calendar-legend" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.85rem' }}>
                <div><span className="dot dot-avail"></span> Available</div>
                <div><span className="dot dot-booked"></span> Full</div>
                <div><span className="dot dot-unavail"></span> Unavailable</div>
              </div>
            </div>

            <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auto-generate Slots</h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                <label className="form-label">Start Time</label>
                <input className="form-input" type="time" value={genStart} onChange={e => setGenStart(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                <label className="form-label">End Time</label>
                <input className="form-input" type="time" value={genEnd} onChange={e => setGenEnd(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                <label className="form-label">Interval (min)</label>
                <select className="form-input" value={genInterval} onChange={e => setGenInterval(e.target.value)}>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={genLoading || !selDate}>
                {genLoading ? 'Generating…' : `Generate Slots (${generateTimeSlots().length})`}
              </button>
              {selDate && (
                <>
                  <button className="btn btn-mint btn-sm" onClick={() => handleToggleDay(true)}>Enable All</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleToggleDay(false)}>Disable All</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Current slots for selected date */}
        <div className="admin-list-side">
          {!selDate ? (
            <div className="card admin-empty"><p>Select a date to view and manage its slots.</p></div>
          ) : slotsLoading ? (
            <div className="admin-loading">Loading slots…</div>
          ) : slots.length === 0 ? (
            <div className="card admin-empty"><p>No slots set for {selDate}. Use the generator on the left.</p></div>
          ) : (
            <div>
              <h4 style={{ marginBottom: '0.75rem' }}>Slots for {selDate} ({slots.length})</h4>
              <div className="admin-event-list">
                {slots.map(s => (
                  <div key={s._id || s.startTime} className="card admin-event-item" style={{ padding: '0.75rem 1rem' }}>
                    <div className="admin-event-item__body">
                      <div className="admin-event-item__title" style={{ fontSize: '1rem' }}>
                        {s.startTime} – {s.endTime}
                      </div>
                      <span className={`badge badge-${s.status === 'booked' ? 'peach' : s.status === 'unavailable' ? 'lavender' : 'mint'}`}>
                        {s.status === 'booked' ? 'Booked' : s.status === 'unavailable' ? 'Disabled' : 'Available'}
                      </span>
                    </div>
                    {s.status !== 'booked' && (
                      <button
                        className="admin-delete-btn"
                        onClick={() => handleRemoveSlot(s.startTime)}
                        title="Remove slot"
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Toast {...toast} />
    </div>
  );
}

// ── Appointments Tab ──────────────────────────────────────────────────────────
function AppointmentsTab() {
  const [subTab, setSubTab] = useState('appointments'); // 'appointments' | 'availability'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [filter, setFilter] = useState('all');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000); };

  const fetchAppts = async () => {
    setLoading(true);
    try {
      const res = await appointmentAPI.adminGetAll({ filter });
      if (res.success) setAppointments(res.appointments);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppts(); }, [filter]);

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentAPI.adminUpdateStatus(id, status);
      showToast(`Appointment marked as ${status}`);
      fetchAppts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Enter cancellation reason (optional):');
    if (reason === null) return;
    try {
      await appointmentAPI.adminCancelAppointment(id, reason);
      showToast('Appointment cancelled.');
      fetchAppts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn btn-sm ${subTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('appointments')}
        >📋 Bookings</button>
        <button
          className={`btn btn-sm ${subTab === 'availability' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('availability')}
        >📅 Set Availability</button>
      </div>

      {subTab === 'availability' && <AvailabilityManager />}

      {subTab === 'appointments' && (
        <div>
          <div className="admin-submissions-header">
            <h2 className="admin-section-title">All Appointments</h2>
            <div className="admin-submissions-filters card">
              <div className="form-group">
                <label className="form-label">Filter</label>
                <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="all">All Appointments</option>
                  <option value="upcoming">Upcoming Confirmed</option>
                  <option value="today">Today Only</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="admin-loading">Loading appointments…</div>
          ) : appointments.length === 0 ? (
            <div className="card admin-empty"><p>No appointments found.</p></div>
          ) : (
            <div className="admin-subs-table-wrap card">
              <table className="admin-subs-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Student</th>
                    <th>MIS ID</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a._id}>
                      <td>
                        <strong>{formatDate(a.date)}</strong>
                        <br/><span className="text-muted">{a.startTime} – {a.endTime}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong title={a.details?.studentName}>{a.studentInitials || '??'}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.details?.studentBranch || ''}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{a.studentMIS || '—'}</span>
                          {a.appointmentId && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--blue-deep)', fontFamily: 'monospace' }}>
                              {a.appointmentId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${a.status === 'completed' ? 'mint' : a.status === 'cancelled' ? 'peach' : 'blue'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <div title={a.reason} style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.reason || '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {a.status !== 'cancelled' && a.status !== 'completed' && (
                            <>
                              <button className="btn btn-mint btn-sm" onClick={() => handleStatusChange(a._id, 'completed')}>Done</button>
                              <button className="btn btn-peach btn-sm" onClick={() => handleCancel(a._id)}>Cancel</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Toast {...toast} />
        </div>
      )}
    </div>
  );
}

// ── Past Events Tab ───────────────────────────────────────────────────────────
function PastEventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({ title: '', eventDate: '', location: '', category: 'Workshop', shortDescription: '', description: '', organizer: '', featuredImage: '' });
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await pastEventsAPI.adminGetAll();
      if (res.success) setEvents(res.events || []);
    } catch (err) {
      setToast({ msg: err.message, type: 'error' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title) { setToast({ msg: 'Title is required', type: 'error' }); return; }
    setActionLoading(true);
    try {
      await pastEventsAPI.create(form);
      setForm({ title: '', eventDate: '', location: '', category: 'Workshop', shortDescription: '', description: '', organizer: '', featuredImage: '' });
      fetchEvents();
      setToast({ msg: 'Past event added.', type: 'success' });
    } catch (err) { setToast({ msg: err.message, type: 'error' }); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this past event?')) return;
    try {
      await pastEventsAPI.delete(id);
      fetchEvents();
    } catch (err) { setToast({ msg: err.message, type: 'error' }); }
  };

  return (
    <div>
      <h2 className="admin-section-title">Past Events Gallery</h2>
      <form className="admin-form card" onSubmit={handleAdd}>
        <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}><label className="form-label">Category</label><select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option value="Workshop">Workshop</option><option value="Awareness">Awareness</option><option value="Challenge">Challenge</option><option value="Other">Other</option></select></div>
          <div className="form-group" style={{ flex: 1 }}><label className="form-label">Event Date</label><input type="date" className="form-input" value={form.eventDate} onChange={e => setForm({...form, eventDate: e.target.value})} /></div>
        </div>
        <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">Featured Image URL (Base64/URL)</label><input className="form-input" value={form.featuredImage} onChange={e => setForm({...form, featuredImage: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">Short Description</label><textarea className="form-input" rows="2" value={form.shortDescription} onChange={e => setForm({...form, shortDescription: e.target.value})} /></div>
        <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Add Past Event'}</button>
      </form>
      {loading ? <div className="admin-loading">Loading past events…</div> : (
        <div className="admin-list">
          {events.map(ev => (
            <div key={ev._id} className="admin-list-item card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="admin-list-item__main" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 60, height: 60, background: 'var(--off-white)', flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                  {ev.featuredImage ? <img src={ev.featuredImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>📷</div>}
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{ev.title}</strong>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>{ev.category} • {ev.eventDate ? formatDate(ev.eventDate) : 'No date'}</div>
                </div>
              </div>
              <div className="admin-list-item__actions">
                <button className="btn btn-peach btn-sm" onClick={() => handleDelete(ev._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Toast {...toast} />
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────
function TeamTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', contact: '', isCore: false });
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await teamAPI.adminGetAll();
      if (res.success) setMembers(res.members || []);
    } catch (err) { setToast({ msg: err.message, type: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.role) { setToast({ msg: 'Name and role are required', type: 'error' }); return; }
    setActionLoading(true);
    try {
      await teamAPI.create(form);
      setForm({ name: '', role: '', contact: '', isCore: false });
      fetchTeam();
      setToast({ msg: 'Team member added.', type: 'success' });
    } catch (err) { setToast({ msg: err.message, type: 'error' }); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team member?')) return;
    try {
      await teamAPI.delete(id);
      fetchTeam();
    } catch (err) { setToast({ msg: err.message, type: 'error' }); }
  };

  return (
    <div>
      <h2 className="admin-section-title">Manage I-Care We-Care Team</h2>
      <form className="admin-form card" onSubmit={handleAdd}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group" style={{ flex: 1 }}><label className="form-label">Role *</label><input className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})} required /></div>
        </div>
        <div className="form-group"><label className="form-label">Contact (Email/Phone)</label><input className="form-input" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} /></div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" id="isCore" checked={form.isCore} onChange={e => setForm({...form, isCore: e.target.checked})} />
          <label htmlFor="isCore">Core Member?</label>
        </div>
        <button type="submit" className="btn btn-mint" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Add Member'}</button>
      </form>
      
      {loading ? <div className="admin-loading">Loading team…</div> : (
        <div className="admin-list">
          {members.map(m => (
            <div key={m._id} className="admin-list-item card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="admin-list-item__main">
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{m.name} {m.isCore && <span className="badge badge-mint" style={{ marginLeft: '8px' }}>Core</span>}</strong>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>{m.role} {m.contact ? ` • ${m.contact}` : ''}</div>
                </div>
              </div>
              <div className="admin-list-item__actions">
                <button className="btn btn-peach btn-sm" onClick={() => handleDelete(m._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Toast {...toast} />
    </div>
  );
}

// ── Platform Content Tab ──────────────────────────────────────────────────────
function PlatformContentTab() {
  const [content, setContent] = useState(null);
  const [draft, setDraft] = useState({ 
    heroTitle: '', heroSubtitle: '', 
    aboutText: '', visionText: '' 
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await platformContentAPI.adminGet();
      if (res.success) {
        setContent(res.content);
        // Load draft if exists, else published
        const src = res.content.draftVersion || res.content.publishedVersion || {};
        setDraft({
          heroTitle: src.heroTitle || '',
          heroSubtitle: src.heroSubtitle || '',
          aboutText: src.aboutText || '',
          visionText: src.visionText || '',
        });
      }
    } catch (err) { setToast({ msg: err.message, type: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContent(); }, []);

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await platformContentAPI.saveDraft(draft);
      setToast({ msg: 'Draft saved successfully.', type: 'success' });
      fetchContent();
    } catch (err) { setToast({ msg: err.message, type: 'error' }); }
    finally { setActionLoading(false); }
  };

  const handlePublish = async () => {
    if (!window.confirm('Publish these changes to the live platform?')) return;
    setActionLoading(true);
    try {
      await platformContentAPI.publish(draft);
      setToast({ msg: 'Changes published successfully.', type: 'success' });
      fetchContent();
    } catch (err) { setToast({ msg: err.message, type: 'error' }); }
    finally { setActionLoading(false); }
  };

  const handleRevert = async () => {
    if (!window.confirm('Discard draft and revert to published version?')) return;
    try {
      await platformContentAPI.revert();
      setToast({ msg: 'Reverted to published version.', type: 'success' });
      fetchContent();
    } catch (err) { setToast({ msg: err.message, type: 'error' }); }
  };

  return (
    <div>
      <div className="admin-submissions-header">
        <h2 className="admin-section-title">Manage Platform Content</h2>
        {content?.hasDraft && (
          <span className="badge badge-peach" style={{ marginLeft: '1rem' }}>Unpublished Changes</span>
        )}
      </div>
      {loading ? <div className="admin-loading">Loading content…</div> : (
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <form onSubmit={handleSaveDraft}>
            <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)', color: 'var(--blue-deep)' }}>Hero Section</h3>
            <div className="form-group">
              <label className="form-label">Hero Title</label>
              <input className="form-input" value={draft.heroTitle} onChange={e => setDraft({...draft, heroTitle: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Hero Subtitle</label>
              <textarea className="form-input" rows="2" value={draft.heroSubtitle} onChange={e => setDraft({...draft, heroSubtitle: e.target.value})} />
            </div>
            
            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)', color: 'var(--blue-deep)' }}>About / Vision</h3>
            <div className="form-group">
              <label className="form-label">About Text</label>
              <textarea className="form-input" rows="4" value={draft.aboutText} onChange={e => setDraft({...draft, aboutText: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Vision Text</label>
              <textarea className="form-input" rows="3" value={draft.visionText} onChange={e => setDraft({...draft, visionText: e.target.value})} />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="submit" className="btn btn-secondary" disabled={actionLoading}>Save as Draft</button>
              <button type="button" className="btn btn-mint" onClick={handlePublish} disabled={actionLoading}>Publish to Live</button>
              {content?.hasDraft && (
                <button type="button" className="btn btn-peach" onClick={handleRevert} disabled={actionLoading}>Discard Draft</button>
              )}
            </div>
          </form>
        </div>
      )}
      <Toast {...toast} />
    </div>
  );
}

// ── Main AdminDashboard ───────────────────────────────────────────────────────

import { useSearchParams } from 'react-router-dom';

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'Overview';

  const setTab = (t) => {
    setSearchParams({ tab: t });
  };

  return (
    <div className="admin-dash">
      <div className="admin-dash__header">
        <div className="container admin-dash__header-inner">
          <div className="admin-dash__header-text">
            <span className="section-tag">Admin Panel</span>
            <h1 className="admin-dash__title">COEP मित्र — Control Centre</h1>
            <p className="admin-dash__sub">Manage all platform content, challenge, and monitor student engagement.</p>
          </div>
          <div className="admin-dash__header-actions desktop-only">
            <span className="admin-dash__welcome">Logged in as <strong>Admin</strong></span>
          </div>
        </div>

      </div>

      <div className="container admin-dash__content">
        {tab === 'Overview'         && <OverviewTab setTab={setTab} />}
        {tab === 'Events'           && <EventsTab />}
        {tab === 'Past Events'      && <PastEventsTab />}
        {tab === 'Team'             && <TeamTab />}
        {tab === 'Platform Content' && <PlatformContentTab />}
        {tab === 'Appointments'     && <AppointmentsTab />}
        {tab === 'Reports'          && <ReportsTab />}
        {tab === 'Journeys'         && <ChallengeTab />}
        {tab === 'Wellness Centre'  && <WellnessTab />}
        {tab === 'Submissions'      && <SubmissionsTab />}
        {tab === 'Analytics'        && <AnalyticsTab />}
      </div>
    </div>
  );
}
