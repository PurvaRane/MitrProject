import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { useApp } from '../context/AppContext';
import { authAPI, appointmentAPI, pastEventsAPI } from '../api';
import OnboardingModal from '../components/OnboardingModal';
import './UserDashboard.css';

function formatDate(d) {
  if (!d) return '';
  // If it's a plain date string like "2026-09-18", parse at noon to avoid UTC midnight → wrong day in IST
  const dateObj = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00') : new Date(d);
  return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatEventYear(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).getFullYear();
}

function getDaysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Past Event Modal ──────────────────────────────────────────────────────────
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

        {/* Image Gallery */}
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
              {images[galleryIdx]?.caption && (
                <div className="gallery-caption">{images[galleryIdx].caption}</div>
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

        {/* Description */}
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

export default function UserDashboard() {
  const { user, updateUser } = useContext(AuthContext);
  const {
    events, eventsLoading,
    wellnessInfo, wellnessLoading,
    eventReports, reportsLoading,
    pastEvents, pastEventsLoading,
    fetchPastEvents,
  } = useApp();

  const [expandReport, setExpandReport] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedPastEvent, setSelectedPastEvent] = useState(null);

  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await appointmentAPI.getMyAppointments();
        if (res.success) setAppointments({ upcoming: res.upcoming, past: res.past });
      } catch (err) {
        console.error('Failed to fetch appointments', err);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (user && user.hasSeenOnboarding === false) {
      setShowOnboarding(true);
    }
  }, [user]);

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
      {selectedPastEvent && (
        <PastEventModal event={selectedPastEvent} onClose={() => setSelectedPastEvent(null)} />
      )}

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
          <div className="user-dash__actions">
            <Link to="/challenge" className="btn btn-mint btn-sm" style={{ marginRight: '1rem' }}>Discover Journeys</Link>
            <Link to="/book-appointment" className="btn btn-primary btn-sm">Book Session</Link>
          </div>
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

        {/* ── Well-being Journeys CTA ── */}
        <section className="user-dash__section">
          <div className="user-dash__refl-banner card glass" style={{ borderColor: 'var(--border)' }}>
            <div className="user-dash__refl-banner-content">
              <div className="user-dash__refl-icon" style={{ backgroundColor: 'rgba(56, 178, 172, 0.1)', color: 'var(--mint)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <h3 className="user-dash__refl-title">Well-being Journeys</h3>
                <p className="user-dash__refl-sub">Join guided challenges, complete tasks at your own pace, and build healthy habits.</p>
              </div>
            </div>
            <Link to="/challenge" className="btn btn-primary btn-sm">Explore Challenges</Link>
          </div>
        </section>

        {/* ── My Appointments ── */}
        <section className="user-dash__section">
          <div className="user-dash__section-header">
            <span className="section-tag">My Appointments</span>
            <Link to="/book-appointment" className="btn btn-mint btn-sm">Book New</Link>
          </div>
          {appointmentsLoading ? (
            <div className="ud-loading">Loading appointments…</div>
          ) : appointments.upcoming.length === 0 && appointments.past.length === 0 ? (
            <div className="user-dash__empty card">
              <p>You have no appointments. Reach out to a counselor if you need support.</p>
            </div>
          ) : (
            <div className="ud-appointments">
              {appointments.upcoming.length > 0 && (
                <div className="ud-appointments-group">
                  <h3 className="ud-appointments-group-title">Upcoming</h3>
                  {appointments.upcoming.map(a => (
                    <div key={a._id} className="ud-appt-card upcoming card">
                      <div className="ud-appt-card__left">
                        <span className="badge badge-mint">{a.status}</span>
                        <h4 className="ud-appt-card__date">{formatDate(a.date)} at {a.startTime}</h4>
                        <p className="ud-appt-card__counselor">Counselor Session</p>
                        {a.appointmentId && (
                          <p className="ud-appt-card__id">ID: <strong>{a.appointmentId}</strong></p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {appointments.past.length > 0 && (
                <div className="ud-appointments-group mt-xl">
                  <h3 className="ud-appointments-group-title">Past & Cancelled</h3>
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

        {/* ── Events ── */}
        <section className="user-dash__section">
          <div className="user-dash__section-header">
            <span className="section-tag">Upcoming Events</span>
            <Link to="/events" className="user-dash__see-all">See all →</Link>
          </div>
          {eventsLoading ? <div className="ud-loading">Loading events…</div>
          : events.length === 0 ? <div className="user-dash__empty"><p>No events scheduled yet.</p></div>
          : (
            <div className="user-dash__events-grid grid-responsive">
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

        {/* ── Past Events Gallery ── */}
        <section className="user-dash__section past-events-section">
          <div className="user-dash__section-header">
            <span className="section-tag">Memories</span>
            <h2 className="past-events-section-title">Moments from COEP मित्र</h2>
          </div>
          <p className="past-events-subtitle">
            A look back at the activities, workshops and initiatives conducted by COEP "मित्र".
          </p>

          {pastEventsLoading ? (
            <div className="ud-loading">Loading events gallery…</div>
          ) : pastEvents.length === 0 ? (
            <div className="user-dash__empty past-events-empty">
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
                      {ev.eventDate && <span>{formatEventYear(ev.eventDate)}</span>}
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
