import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { useApp } from '../context/AppContext';
import { authAPI, appointmentAPI } from '../api';
import OnboardingModal from '../components/OnboardingModal';
import './UserDashboard.css';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDaysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function UserDashboard() {
  const { user, updateUser } = useContext(AuthContext);
  const {
    events, eventsLoading,
    wellnessInfo, wellnessLoading,
    eventReports, reportsLoading
  } = useApp();

  const [expandReport, setExpandReport] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
