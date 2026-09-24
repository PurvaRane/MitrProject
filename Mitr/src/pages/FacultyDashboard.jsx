import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { useApp } from '../context/AppContext';
import { authAPI, userAPI, appointmentAPI, pastEventsAPI } from '../api';
import OnboardingModal from '../components/OnboardingModal';
import PlatformFeedbackSection from '../components/PlatformFeedbackSection';
import './UserDashboard.css';
import './FacultyDashboard.css';

function formatDate(d) {
  if (!d) return '';
  const dateObj = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00') : new Date(d);
  return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDaysAway(dateStr) {
  if (!dateStr) return '';
  const diff = new Date(dateStr) - new Date();
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'Today';
  return days === 1 ? '1 day away' : `${days} days away`;
}

function formatDuration(days) {
  const d = Number(days) || 0;
  return d === 1 ? '1 day' : `${d} days`;
}

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

// ── Past Event Modal (reused) ───────────────────────────────────────────────
function PastEventModal({ event, onClose }) {
  const [galleryIdx, setGalleryIdx] = useState(0);
  const images = event.images || [];
  const featured = event.featuredImage;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setGalleryIdx(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setGalleryIdx(i => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [images.length, onClose]);

  return (
    <div className="past-event-modal-overlay" onClick={onClose}>
      <div className="past-event-modal" onClick={e => e.stopPropagation()}>
        <button className="past-event-modal__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="past-event-modal__header">
          <span className="badge badge-lavender">{event.category}</span>
          <h2 className="past-event-modal__title">{event.title}</h2>
          <div className="past-event-modal__meta">
            {event.eventDate && <span>📅 {formatDate(event.eventDate)}</span>}
            {event.location && <span>📍 {event.location}</span>}
            {event.organizer && <span>🏛️ {event.organizer}</span>}
          </div>
        </div>

        {images.length > 0 ? (
          <div className="past-event-gallery">
            <div className="past-event-gallery__main">
              <img
                src={images[galleryIdx]?.url}
                alt={images[galleryIdx]?.caption || event.title}
                className="past-event-gallery__featured-img"
              />
              {images.length > 1 && (
                <>
                  <button
                    className="gallery-nav gallery-nav--prev"
                    onClick={() => setGalleryIdx(i => Math.max(i - 1, 0))}
                    disabled={galleryIdx === 0}
                  >‹</button>
                  <button
                    className="gallery-nav gallery-nav--next"
                    onClick={() => setGalleryIdx(i => Math.min(i + 1, images.length - 1))}
                    disabled={galleryIdx === images.length - 1}
                  >›</button>
                  <div className="gallery-counter">{galleryIdx + 1} / {images.length}</div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="past-event-gallery__thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`gallery-thumb ${galleryIdx === i ? 'active' : ''}`}
                    onClick={() => setGalleryIdx(i)}
                  >
                    <img src={img.url} alt={img.caption || `Photo ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : featured ? (
          <div className="past-event-gallery">
            <img src={featured} alt={event.title} className="past-event-gallery__featured-img" />
          </div>
        ) : null}

        {(event.shortDescription || event.description) && (
          <div className="past-event-modal__desc">
            <h3>About the Event</h3>
            <p>{event.description || event.shortDescription}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FacultyDashboard() {
  const { user, updateUser } = useContext(AuthContext);
  const {
    events, eventsLoading,
    challenges, challengeLoading,
    wellnessInfo, wellnessLoading,
    pastEvents, pastEventsLoading,
  } = useApp();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedPastEvent, setSelectedPastEvent] = useState(null);
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  // Department edit modal / state
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [deptInput, setDeptInput] = useState(user?.department || '');
  const [savingDept, setSavingDept] = useState(false);
  const [deptFeedback, setDeptFeedback] = useState('');

  useEffect(() => {
    if (user && user.hasSeenOnboarding === false) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    setDeptInput(user?.department || '');
  }, [user?.department]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await appointmentAPI.getMyAppointments();
        if (res.success) setAppointments({ upcoming: res.upcoming || [], past: res.past || [] });
      } catch (err) {
        console.error('Failed to fetch faculty appointments', err);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

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

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setSavingDept(true);
    setDeptFeedback('');
    try {
      const res = await userAPI.updateProfile({ department: deptInput });
      if (res.success && res.user) {
        updateUser(res.user);
        setIsEditingDept(false);
        setDeptFeedback('Department updated successfully.');
        setTimeout(() => setDeptFeedback(''), 3000);
      }
    } catch (err) {
      setDeptFeedback(err.message || 'Failed to update department.');
    } finally {
      setSavingDept(false);
    }
  };

  const facultyPrefix = user?.name?.match(/^(Dr\.|Prof\.)/i) ? '' : 'Prof. ';

  return (
    <div className="user-dash faculty-dash">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      {selectedPastEvent && (
        <PastEventModal event={selectedPastEvent} onClose={() => setSelectedPastEvent(null)} />
      )}

      {/* Header */}
      <div className="user-dash__header faculty-dash__header">
        <div className="container user-dash__header-inner">
          <div>
            <span className="section-tag faculty-badge">Faculty Dashboard</span>
            <h1 className="user-dash__title">Welcome, {facultyPrefix}{user?.name || 'Faculty Member'}</h1>
            <div className="divider" style={{ marginBottom: '0.75rem' }} />
            <p className="user-dash__sub">
              {user?.department ? `${user.department} · ` : ''}COEP "मित्र" Mental Health & Wellbeing
            </p>
          </div>
          <div className="user-dash__actions">
            <Link to="/personal-growth" className="btn btn-sm cta-personal-growth" style={{ marginRight: '0.75rem' }}>
              Personal Growth
            </Link>
            <Link to="/challenge" className="btn btn-mint btn-sm cta-discover-challenges" style={{ marginRight: '0.75rem' }}>
              Discover Challenges
            </Link>
            <Link to="/book-appointment" className="btn btn-primary btn-sm cta-book-session">
              Book Session
            </Link>
          </div>
        </div>
      </div>

      <div className="container user-dash__body">

        {/* ── Faculty Profile Quick-Card ── */}
        <section className="user-dash__section">
          <div className="card faculty-profile-card">
            <div className="faculty-profile-card__content">
              <div className="faculty-profile-avatar">
                <span>{(user?.name || 'F').charAt(0).toUpperCase()}</span>
              </div>
              <div className="faculty-profile-details">
                <div className="faculty-profile-name">{user?.name}</div>
                <div className="faculty-profile-meta">
                  <span className="faculty-profile-item">📧 {user?.email}</span>
                  <span className="faculty-profile-item">
                    🏛️ {user?.department ? user.department : <em style={{ color: 'var(--text-muted)' }}>Department not provided</em>}
                  </span>
                </div>
              </div>
            </div>
            <div className="faculty-profile-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link to="/personal-growth" className="btn btn-sm cta-personal-growth">Personal Growth</Link>
              <button
                type="button"
                className="btn btn-sm cta-edit-dept"
                onClick={() => setIsEditingDept(true)}
              >
                {user?.department ? 'Edit Department' : '+ Add Department'}
              </button>
            </div>
          </div>
          {deptFeedback && (
            <div className="faculty-toast animate-fade-in" style={{ marginTop: '0.75rem' }}>
              {deptFeedback}
            </div>
          )}
        </section>

        {/* ── Department Edit Modal ── */}
        {isEditingDept && (
          <div className="past-event-modal-overlay" onClick={() => setIsEditingDept(false)}>
            <div className="faculty-modal card" onClick={e => e.stopPropagation()}>
              <div className="faculty-modal__header">
                <h3>Edit Department</h3>
                <button
                  type="button"
                  className="past-event-modal__close"
                  onClick={() => setIsEditingDept(false)}
                >✕</button>
              </div>
              <form onSubmit={handleSaveDepartment}>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label" htmlFor="faculty-dept-field">Department</label>
                  <select
                    id="faculty-dept-field"
                    className="form-input"
                    value={deptInput}
                    onChange={e => setDeptInput(e.target.value)}
                    autoFocus
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="form-hint" style={{ marginTop: '6px' }}>
                    Faculty members may belong to any academic or administrative department.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEditingDept(false)}
                    disabled={savingDept}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={savingDept}
                  >
                    {savingDept ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Available Wellbeing Challenges ── */}
        <section className="user-dash__section">
          <div className="user-dash__section-header">
            <div>
              <span className="section-tag">Healthy Habits</span>
              <h2 className="section-title-sm">Available Wellbeing Challenges</h2>
            </div>
            <Link to="/challenge" className="user-dash__see-all">Explore all →</Link>
          </div>

          {challengeLoading ? (
            <div className="ud-loading">Loading challenges…</div>
          ) : challenges.length === 0 ? (
            <div className="user-dash__empty card">
              <p>No active challenges at the moment. New challenges will be announced soon.</p>
            </div>
          ) : (
            <div className="user-dash__events-grid grid-responsive">
              {challenges.slice(0, 3).map(c => (
                <div key={c._id} className="card ud-challenge-card">
                  <div className="ud-challenge-card__top">
                    <span className="badge badge-lavender">{c.category || 'Mindfulness'}</span>
                    <span className="countdown-days"><strong>{formatDuration(c.duration)}</strong></span>
                  </div>
                  <h3 className="ud-challenge-card__title">{c.title}</h3>
                  <p className="ud-challenge-card__desc">{c.description?.slice(0, 90)}{c.description?.length > 90 ? '…' : ''}</p>
                  <div className="ud-challenge-card__footer">
                    {c.startDate && (
                      <span className="ud-challenge-card__date">
                        📅 Starts: {formatDate(c.startDate)}
                      </span>
                    )}
                    <Link to="/challenge" className="btn btn-mint btn-sm">
                      Participate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Upcoming COEP "मित्र" Events ── */}
        <section className="user-dash__section">
          <div className="user-dash__section-header">
            <div>
              <span className="section-tag">Campus Wellness</span>
              <h2 className="section-title-sm">Upcoming COEP "मित्र" Events</h2>
            </div>
            <Link to="/events" className="user-dash__see-all">See all →</Link>
          </div>
          {eventsLoading ? (
            <div className="ud-loading">Loading events…</div>
          ) : events.length === 0 ? (
            <div className="user-dash__empty card"><p>No events scheduled yet.</p></div>
          ) : (
            <div className="user-dash__events-grid grid-responsive">
              {events.slice(0, 3).map(ev => {
                const daysText = formatDaysAway(ev.date);
                return (
                  <div key={ev._id || ev.id} className="ud-event-card card">
                    {ev.imageUrl ? (
                      <img src={ev.imageUrl} alt={ev.title} className="ud-event-card__img" />
                    ) : (
                      <div className={`ud-event-card__placeholder placeholder--${ev.category === 'Workshop' ? 'blue' : ev.category === 'Awareness' ? 'lavender' : 'mint'}`} />
                    )}
                    <div className="ud-event-card__body">
                      <span className={`badge badge-${ev.category === 'Workshop' ? 'blue' : ev.category === 'Awareness' ? 'lavender' : 'mint'}`}>{ev.category}</span>
                      <h3 className="ud-event-card__title">{ev.title}</h3>
                      {ev.description && <p className="ud-event-card__desc">{ev.description.slice(0, 70)}{ev.description.length > 70 ? '…' : ''}</p>}
                      <div className="ud-event-card__meta">
                        <span>{formatDate(ev.date)}</span>
                        <span className={daysText === 'Today' ? 'ud-event-card__today' : 'ud-event-card__days'}>
                          {daysText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Confidential Support Appointments ── */}
        <section className="user-dash__section">
          <div className="user-dash__section-header">
            <div>
              <span className="section-tag">Consultation</span>
              <h2 className="section-title-sm">Support Appointments</h2>
            </div>
            <Link to="/book-appointment" className="btn btn-mint btn-sm">Book Consultation</Link>
          </div>

          {appointmentsLoading ? (
            <div className="ud-loading">Loading appointments…</div>
          ) : appointments.upcoming.length === 0 && appointments.past.length === 0 ? (
            <div className="user-dash__empty card">
              <p>You have no scheduled appointments. COEP "मित्र" offers confidential counselling support for all faculty members.</p>
            </div>
          ) : (
            <div className="ud-appointments">
              {appointments.upcoming.length > 0 && (
                <div className="ud-appointments-group">
                  <h3 className="ud-appointments-group-title">Upcoming Sessions</h3>
                  {appointments.upcoming.map(a => (
                    <div key={a._id} className="ud-appt-card upcoming card">
                      <div className="ud-appt-card__left">
                        <span className="badge badge-mint">{a.status}</span>
                        <h4 className="ud-appt-card__date">{formatDate(a.date)} at {a.startTime}</h4>
                        <p className="ud-appt-card__counselor">Counselor Session · Dr. Kshipra V. Moghe</p>
                        {a.appointmentId && (
                          <p className="ud-appt-card__id">Appointment ID: <strong>{a.appointmentId}</strong></p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {appointments.past.length > 0 && (
                <div className="ud-appointments-group mt-xl">
                  <h3 className="ud-appointments-group-title">Past Sessions</h3>
                  {appointments.past.slice(0, 3).map(a => (
                    <div key={a._id} className="ud-appt-card past">
                      <div className="ud-appt-card__left">
                        <span className={`badge badge-${a.status === 'completed' ? 'blue' : 'peach'}`}>{a.status}</span>
                        <span className="ud-appt-card__date">{formatDate(a.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Personal Growth & Reflection Journal ── */}
        <section className="user-dash__section">
          <div className="user-dash__refl-banner card glass-lavender">
            <div className="user-dash__refl-banner-content">
              <div className="user-dash__refl-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <h3 className="user-dash__refl-title">Faculty Reflection &amp; Growth</h3>
                <p className="user-dash__refl-sub">
                  A private, confidential space for decompression, self-reflection, and tracking your personal wellbeing.
                </p>
              </div>
            </div>
            <Link to="/reflect" className="btn btn-primary btn-sm">Open Journal</Link>
          </div>
        </section>

        {/* ── Support Resources Section ── */}
        <section className="user-dash__section">
          <div className="user-dash__section-header">
            <span className="section-tag">Assistance</span>
            <h2 className="section-title-sm">Support Resources &amp; Contacts</h2>
          </div>
          <div className="card faculty-support-card">
            <div className="faculty-support-grid">
              <div className="faculty-support-col">
                <div className="faculty-support-heading">🏛️ Consulting Psychologist</div>
                <div className="faculty-support-name">Dr. Kshipra V. Moghe</div>
                <div className="faculty-support-sub">Nodal Officer &amp; Incharge – Mental Health &amp; Wellbeing Initiative: COEP "मित्र"</div>
                <p className="faculty-support-desc">Asst. Professor – Psychology &amp; Consulting Psychologist</p>
                <div className="faculty-support-email">
                  <a href="mailto:kam.appsci@coeptech.ac.in">kam.appsci@coeptech.ac.in</a>
                </div>
              </div>
              <div className="faculty-support-col">
                <div className="faculty-support-heading">🤝 I-Care We-Care Team</div>
                <p className="faculty-support-desc">
                  Peer volunteers and coordinators dedicated to promoting mental health awareness and supporting university events.
                </p>
                <Link to="/support" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                  View All Resources &amp; Helplines →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Moments from COEP मित्र ── */}
        <section className="user-dash__section past-events-section">
          <div className="user-dash__section-header">
            <span className="section-tag">Memories</span>
            <h2 className="past-events-section-title">Moments from COEP मित्र</h2>
          </div>
          <p className="past-events-subtitle">
            A look back at the activities, workshops, and initiatives conducted by COEP "मित्र".
          </p>

          {pastEventsLoading ? (
            <div className="ud-loading">Loading events gallery…</div>
          ) : pastEvents.length === 0 ? (
            <div className="user-dash__empty past-events-empty card">
              <div className="past-events-empty-icon">🌱</div>
              <p>Past activities and event moments will appear here.</p>
            </div>
          ) : (
            <div className="past-events-grid">
              {pastEvents.slice(0, 6).map(ev => (
                <div
                  key={ev._id}
                  className="past-event-card card animate-fade-in"
                  onClick={() => setSelectedPastEvent(ev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedPastEvent(ev)}
                >
                  <div className="past-event-card__img-wrap">
                    {ev.featuredImage ? (
                      <img src={ev.featuredImage} alt={ev.title} className="past-event-card__img" />
                    ) : (
                      <div className="past-event-card__placeholder">
                        <span>📷</span>
                      </div>
                    )}
                    <div className="past-event-card__overlay">
                      <span className="past-event-card__view-btn">View Photos →</span>
                    </div>
                    <span className="past-event-card__category badge badge-lavender">{ev.category}</span>
                    {ev.images?.length > 0 && (
                      <span className="past-event-card__count">📷 {ev.images.length}</span>
                    )}
                  </div>
                  <div className="past-event-card__body">
                    <h3 className="past-event-card__title">{ev.title}</h3>
                    <div className="past-event-card__meta">
                      {ev.eventDate && <span>{formatDate(ev.eventDate)}</span>}
                      {ev.location && <span>· {ev.location}</span>}
                    </div>
                    {ev.shortDescription && (
                      <p className="past-event-card__desc">{ev.shortDescription.slice(0, 80)}{ev.shortDescription.length > 80 ? '…' : ''}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Faculty Feedback & Suggestions ── */}
        <PlatformFeedbackSection
          title="Faculty Feedback & Institutional Suggestions"
          subtitle="Share your suggestions for academic wellbeing, institutional events, staff-student support initiatives, or platform enhancements."
        />

      </div>
    </div>
  );
}
