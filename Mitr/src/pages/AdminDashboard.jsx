import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { useApp } from '../context/AppContext';
import { adminAPI, submissionsAPI, appointmentAPI } from '../api';
import './AdminDashboard.css';

const TABS = ['Overview', 'Events', 'Appointments', 'Reports', 'Challenge', 'Wellness', 'Submissions', 'Analytics'];
const CATEGORIES = ['Workshop', 'Awareness', 'Challenge', 'Seminar', 'Other'];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
          { label: 'Total Users', val: stats?.totalUsers ?? '—', color: 'blue' },
          { label: 'Active Users', val: stats?.activeUsersCount ?? '—', color: 'mint' },
          { label: 'Total Submissions', val: stats?.totalSubmissions ?? '—', color: 'lavender' },
          { label: 'Today\'s Completions', val: stats?.todayCompletions ?? '—', color: 'blue' },
          { label: 'Reflections', val: stats?.totalReflections ?? '—', color: 'mint' },
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
          { icon: '📆', title: 'Appointments', desc: 'Manage slots & bookings', tab: 'Appointments', color: 'peach' },
          { icon: '📝', title: 'User Submissions', desc: 'View reflections & images', tab: 'Submissions', color: 'mint' },
          { icon: '🌱', title: 'Challenge Control', desc: 'Set active day & manage tasks', tab: 'Challenge', color: 'lavender' },
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
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ day: '', hasReflection: 'false', hasImage: 'false' });

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const activeFilters = {};
      if (filters.day) activeFilters.day = filters.day;
      if (filters.hasReflection === 'true') activeFilters.hasReflection = 'true';
      if (filters.hasImage === 'true') activeFilters.hasImage = 'true';
      
      const data = await submissionsAPI.getAll(activeFilters);
      setSubs(data.submissions || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubs(); }, [filters]);

  return (
    <div>
      <div className="admin-submissions-header">
        <h2 className="admin-section-title">User Submissions & Reflections</h2>
        <div className="admin-submissions-filters card">
          <div className="form-group">
            <label className="form-label">Filter by Day</label>
            <select className="form-input" value={filters.day} onChange={e => setFilters(f => ({ ...f, day: e.target.value }))}>
              <option value="">All Days</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Day {d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <label className="admin-check-label">
                <input type="checkbox" checked={filters.hasReflection === 'true'} onChange={e => setFilters(f => ({ ...f, hasReflection: e.target.checked ? 'true' : 'false' }))} />
                Reflections
              </label>
              <label className="admin-check-label">
                <input type="checkbox" checked={filters.hasImage === 'true'} onChange={e => setFilters(f => ({ ...f, hasImage: e.target.checked ? 'true' : 'false' }))} />
                Images
              </label>
            </div>
          </div>
        </div>
      </div>

      {loading ? <div className="admin-loading">Loading submissions…</div> : subs.length === 0 ? (
        <div className="card admin-empty"><p>No submissions found for these filters.</p></div>
      ) : (
        <div className="admin-subs-table-wrap card">
          <table className="admin-subs-table">
            <thead>
              <tr>
                <th>User</th>
                <th>MIS ID</th>
                <th>Day</th>
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
                  <td><span className="badge badge-lavender">Day {s.challengeDay}</span></td>
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
                {dayStats.map(r => (
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

// ── Appointments Tab ──────────────────────────────────────────────────────────
function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [filter, setFilter] = useState('all'); // all, upcoming, today, pending
  
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
    const reason = prompt("Enter cancellation reason (optional):");
    if (reason === null) return;
    try {
      await appointmentAPI.adminCancelAppointment(id, reason);
      showToast('Appointment cancelled');
      fetchAppts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="admin-submissions-header">
        <h2 className="admin-section-title">Manage Appointments</h2>
        <div className="admin-submissions-filters card">
          <div className="form-group">
            <label className="form-label">Filter</label>
            <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Appointments</option>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="pending">Pending</option>
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
                <th>Date & Time</th>
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
                    <br/><span className="text-muted">{a.startTime}</span>
                  </td>
                  <td>{a.studentId?.name || 'Unknown'}</td>
                  <td>{a.studentId?.misId || '—'}</td>
                  <td><span className={`badge badge-${a.status === 'completed' ? 'mint' : a.status === 'cancelled' ? 'peach' : 'blue'}`}>{a.status}</span></td>
                  <td><div title={a.reason} style={{maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{a.reason || '—'}</div></td>
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
        <div className="container">
          <div className="admin-dash__tabs-wrap">
            {/* Desktop Tabs */}
            <div className="admin-dash__tabs desktop-only">
              {TABS.map(t => (
                <button key={t} className={`admin-tab-btn ${tab === t ? 'admin-tab-btn--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
            {/* Mobile Dropdown */}
            <div className="admin-dash__mobile-nav mobile-only">
              <label className="form-label" htmlFor="admin-tab-select">Select Section</label>
              <select 
                id="admin-tab-select"
                className="form-input" 
                value={tab} 
                onChange={(e) => setTab(e.target.value)}
              >
                {TABS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container admin-dash__content">
        {tab === 'Overview'    && <OverviewTab setTab={setTab} />}
        {tab === 'Events'      && <EventsTab />}
        {tab === 'Appointments' && <AppointmentsTab />}
        {tab === 'Reports'     && <ReportsTab />}
        {tab === 'Challenge'   && <ChallengeTab />}
        {tab === 'Wellness'    && <WellnessTab />}
        {tab === 'Submissions' && <SubmissionsTab />}
        {tab === 'Analytics'   && <AnalyticsTab />}
      </div>
    </div>
  );
}
