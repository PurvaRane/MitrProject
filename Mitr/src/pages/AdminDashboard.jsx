import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { useApp } from '../context/AppContext';
import { adminAPI, submissionsAPI } from '../api';
import './AdminDashboard.css';

const TABS = ['Overview', 'Events', 'Reports', 'Challenge', 'Wellness', 'Submissions', 'Analytics'];
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
  const { events, eventReports, activeDay, activeTask } = useApp();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminAPI.getStats().then(d => setStats(d.stats)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="admin-stats-grid">
        {[
          { label: 'Total Users', val: stats?.totalUsers ?? '—', color: 'blue' },
          { label: 'Active Users', val: stats?.activeUsersCount ?? '—', color: 'mint' },
          { label: 'Total Submissions', val: stats?.totalSubmissions ?? '—', color: 'lavender' },
          { label: 'Active Day', val: activeDay ?? '—', color: 'peach' },
          { label: 'Today\'s Completions', val: stats?.todayCompletions ?? '—', color: 'blue' },
          { label: 'Reflections', val: stats?.totalReflections ?? '—', color: 'mint' },
        ].map(s => (
          <div key={s.label} className={`card admin-stat admin-stat--${s.color}`}>
            <div className="admin-stat__val">{s.val}</div>
            <div className="admin-stat__label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="admin-quick-actions">
        {[
          { icon: '📅', title: 'Manage Events', desc: 'Add, edit or delete events', tab: 'Events', color: 'blue' },
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
      {activeTask && (
        <div className="card admin-active-info">
          <div className="admin-active-info__label">Currently Active Challenge</div>
          <div className="admin-active-info__day">Day {activeDay}</div>
          <div className="admin-active-info__task">{activeTask.title}</div>
          <div className="admin-active-info__note">{activeTask.description}</div>
        </div>
      )}
    </div>
  );
}

// ── Events Tab ────────────────────────────────────────────────────────────────
function EventsTab() {
  const { events, eventsLoading, addEvent, removeEvent } = useApp();
  const [form, setForm] = useState({ title: '', description: '', date: '', category: 'Workshop', imageUrl: '' });
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
      await addEvent(form);
      setForm({ title: '', description: '', date: '', category: 'Workshop', imageUrl: '' });
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
                </div>
                <button className="admin-delete-btn" onClick={() => handleDelete(ev._id || ev.id)} title="Delete">✕</button>
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
  const { tasks, activeDay, setActiveDay, fetchAllChallenges } = useApp();
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ day: '', title: '', description: '', instructions: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  useEffect(() => { fetchAllChallenges(); }, [fetchAllChallenges]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000); };

  const handleSelectDay = (day) => {
    const task = tasks.find(t => t.day === day);
    setSelected(day);
    setForm(task ? { day: task.day, title: task.title, description: task.description, instructions: task.instructions || '' } : { day, title: '', description: '', instructions: '' });
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) { showToast('Title and description required.', 'error'); return; }
    setLoading(true);
    try {
      const { challengeAPI } = await import('../api');
      await challengeAPI.createOrUpdate({ day: form.day, title: form.title, description: form.description, instructions: form.instructions });
      await fetchAllChallenges();
      showToast(`Day ${form.day} saved.`);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleActivate = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await setActiveDay(selected);
      showToast(`Day ${selected} is now active for all students.`);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="admin-challenge-layout">
        <div className="admin-challenge-grid-side">
          <div className="card admin-active-info" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="admin-active-info__label">Currently Active</div>
            <div className="admin-active-info__day">Day {activeDay}</div>
            <div className="admin-active-info__note">Only Day {activeDay} tasks are visible to students.</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <p className="admin-challenge__hint">Click a day to view/edit. Green = has task content.</p>
            <div className="admin-day-grid">
              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                const has = tasks.some(t => t.day === d);
                return (
                  <button
                    key={d}
                    className={`admin-day-btn ${d === activeDay ? 'admin-day-btn--active' : ''} ${has && d !== activeDay ? 'admin-day-btn--past' : ''}`}
                    onClick={() => handleSelectDay(d)}
                  >
                    <span className="admin-day-btn__num">{d}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-challenge-form-side">
          {selected ? (
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
              <h2 className="admin-section-title">Day {selected} Task</h2>
              <form className="admin-form" onSubmit={handleSaveTask}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this task about?" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Instructions (what the user must do)</label>
                  <textarea className="form-input" rows={4} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Specific step-by-step instructions…" />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Task'}</button>
                  <button className="btn btn-mint btn-sm" type="button" onClick={handleActivate} disabled={loading || selected === activeDay}>
                    {selected === activeDay ? 'Currently Active' : `Activate Day ${selected}`}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card admin-empty"><p>Select a day from the grid to view or edit its task.</p></div>
          )}
        </div>
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
      <div className="admin-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
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

// ── Main AdminDashboard ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');

  return (
    <div className="admin-dash">
      <div className="admin-dash__header">
        <div className="container admin-dash__header-inner">
          <div>
            <span className="section-tag">Admin Panel</span>
            <h1 className="admin-dash__title">COEP मित्र — Control Centre</h1>
            <p className="admin-dash__sub">Manage all platform content, challenge, and monitor student engagement.</p>
          </div>
          <div className="admin-dash__header-actions">
            <span className="admin-dash__welcome">Logged in as <strong>Admin</strong></span>
          </div>
        </div>
        <div className="container">
          <div className="admin-dash__tabs">
            {TABS.map(t => (
              <button key={t} className={`admin-tab-btn ${tab === t ? 'admin-tab-btn--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: 'var(--space-2xl)' }}>
        {tab === 'Overview'    && <OverviewTab setTab={setTab} />}
        {tab === 'Events'      && <EventsTab />}
        {tab === 'Reports'     && <ReportsTab />}
        {tab === 'Challenge'   && <ChallengeTab />}
        {tab === 'Wellness'    && <WellnessTab />}
        {tab === 'Submissions' && <SubmissionsTab />}
        {tab === 'Analytics'   && <AnalyticsTab />}
      </div>
    </div>
  );
}
