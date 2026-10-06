import React, { useEffect, useRef, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AuthContext } from '../App';
import EventCard from '../components/EventCard';
import { X } from 'lucide-react';
import './HomePage.css';
import mentalHealthIllustration from '../assets/illustrations/mental-health.png';
import icareTeamImg from '../assets/icare-wecare-team.jpg';
import helplinesImg from '../assets/national-helplines-guide.jpg';

function isEventToday(dateStr) {
  if (!dateStr) return false;
  const normalized = typeof dateStr === 'string' && dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr;
  const target = new Date(normalized);
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

function isEventFuture(dateStr) {
  if (!dateStr) return false;
  const normalized = typeof dateStr === 'string' && dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr;
  const target = new Date(normalized);
  const now = new Date();
  const dTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dTarget > dNow;
}

function useIntersect(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
}

function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  useIntersect(ref);
  return <div ref={ref} className={`reveal-section ${className}`}>{children}</div>;
}

export default function HomePage() {
  const {
    wellnessInfo,
    wellnessLoading,
    events,
    eventsLoading,
    myRegistrations,
    registerForEvent,
    cancelEventRegistration,
  } = useApp();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeModalImage, setActiveModalImage] = useState(null);
  const [registeringId, setRegisteringId] = useState(null);
  const [activeTab, setActiveTab] = useState('ongoing');

  const handleRegister = async (eventId, isReg) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setRegisteringId(eventId);
    try {
      if (isReg) await cancelEventRegistration(eventId);
      else await registerForEvent(eventId);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setRegisteringId(null);
    }
  };

  // Filter out cancelled events
  const activeEvents = (events || []).filter((e) => e.status !== 'Cancelled');

  // Ongoing events: status is explicitly Ongoing OR date is today (and not completed)
  const ongoingEvents = activeEvents.filter(
    (e) => e.status === 'Ongoing' || (e.status !== 'Completed' && isEventToday(e.date))
  );

  // Upcoming events: strict future date, and not in ongoing.
  // This automatically handles an event passing its date by excluding it here.
  const upcomingEvents = activeEvents.filter((e) => {
    if (e.status === 'Completed') return false;
    const isOngoing = ongoingEvents.some((o) => (o._id || o.id) === (e._id || e.id));
    if (isOngoing) return false;
    return isEventFuture(e.date);
  });

  // Past events: status is Completed OR date has passed (neither today nor future) and not ongoing.
  // This ensures events automatically become "past events" once their date passes.
  const pastEventsList = activeEvents.filter(
    (e) => {
      const isOngoing = ongoingEvents.some((o) => (o._id || o.id) === (e._id || e.id));
      if (isOngoing) return false;
      return e.status === 'Completed' || (!isEventToday(e.date) && !isEventFuture(e.date));
    }
  );

  // Gracefully switch to upcoming tab on initial load if ongoing has 0 events
  const hasInitializedTab = useRef(false);
  useEffect(() => {
    if (!hasInitializedTab.current && !eventsLoading && (events?.length > 0)) {
      if (ongoingEvents.length === 0 && upcomingEvents.length > 0) {
        setActiveTab('upcoming');
      } else if (ongoingEvents.length === 0 && upcomingEvents.length === 0 && pastEventsList.length > 0) {
        setActiveTab('past');
      }
      hasInitializedTab.current = true;
    }
  }, [eventsLoading, events?.length, ongoingEvents.length, upcomingEvents.length, pastEventsList.length]);

  const ADMIN_ROLES = ['admin', 'master_admin', 'sub_admin'];
  const dashboardPath = user
    ? ADMIN_ROLES.includes(user.role)
      ? '/admin-dashboard'
      : user.role === 'faculty'
      ? '/faculty-dashboard'
      : '/user-dashboard'
    : '/login';

  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__blob hero__blob--1" />
        <div className="hero__blob hero__blob--2" />
        <div className="hero__blob hero__blob--3" />

        {/* ── Brand Header Row: Left = COEP, Right = Mitr (No overlapping) ── */}
        <div className="hero__brand-header container">
          <div className="hero__brand-card hero__brand-card--coep" aria-label="COEP Tech logo">
            <img src="/assets/coeplogo.png" alt="COEP Technological University" />
          </div>
          <div className="hero__brand-card hero__brand-card--mitr" aria-label="COEP Mitr logo">
            <img src="/assets/mitrlogo.png" alt="COEP मित्र" />
          </div>
        </div>

        <div className="hero__content container">
          <div className="hero__text animate-fade-in-up">
            <span className="badge badge-blue hero__badge">COEP मित्र · Wellness Centre</span>
            <h1 className="hero__heading animate-fade-in-up delay-100">
              Every life is<br />
              <em>worth living,</em><br />
              every breath is<br />
              <em>worth saving</em>
            </h1>
            <p className="hero__sub animate-fade-in-up delay-200">
              A safe, confidential, and supportive space - exclusively for COEP Technological University students and faculty.
            </p>
            <div className="hero__cta animate-fade-in-up delay-300">
              {user ? (
                <Link to={dashboardPath} className="btn btn-primary">Go to Dashboard</Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">Join the Platform</Link>
                  <Link to="/login" className="btn btn-secondary">Login to Portal</Link>
                </>
              )}
            </div>
          </div>

          <div className="hero__illustration animate-float">
            <div className="hero__img-wrap">
              <img 
                src={mentalHealthIllustration} 
                alt="Mental Health Illustration" 
                className="hero__illustration-img"
              />
            </div>
          </div>
        </div>

        <div className="hero__wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,30 C360,80 1080,-20 1440,30 L1440,80 L0,80 Z" fill="var(--off-white)"/>
          </svg>
        </div>
      </section>

      {/* ── About (from DB) ── */}
      <AnimatedSection>
        <section className="section about">
          <div className="container about__inner">
            <div className="about__text">
              <span className="section-tag">About COEP मित्र</span>
              {wellnessLoading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
              ) : wellnessInfo ? (
                <>
                  <h2 className="section-title">{wellnessInfo.title}</h2>
                  <div className="divider" />
                  <p className="section-subtitle">{wellnessInfo.description}</p>
                  {wellnessInfo.vision && (
                    <div className="home__vision-block glass-blue">
                      <strong>Our Vision</strong>
                      <p>{wellnessInfo.vision}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="section-title">Your safe space within the campus community</h2>
                  <div className="divider" />
                  <p className="section-subtitle">COEP मित्र is the official mental health and Wellbeing initiative of COEP Technological University. Login or register to access all features.</p>
                </>
              )}
            </div>
            <div className="about__illustration">
              <div className="about__circles">
                <div className="about__circle about__circle--1" />
                <div className="about__circle about__circle--2" />
                <div className="about__circle about__circle--3" />
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── Services (from DB) ── */}
      {wellnessInfo?.services?.length > 0 && (
        <AnimatedSection>
          <section className="section highlights" style={{ background: 'linear-gradient(180deg, var(--off-white) 0%, #EAF4FB 100%)' }}>
            <div className="container">
              <div className="section-header">
                <span className="section-tag">What We Offer</span>
                <h2 className="section-title">Our Services</h2>
                <div className="divider" />
              </div>
              <div className="highlights__grid grid-responsive">
                {wellnessInfo.services.map((s, i) => (
                  <div key={i} className={`highlight-card card highlight-card--${['blue','lavender','mint','peach'][i % 4]}`}>
                    <h3 className="highlight-card__title">{s.title}</h3>
                    <p className="highlight-card__desc">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* ── Section 1: Mental Health Support & Resources ── */}
      <AnimatedSection>
        <section className="section support-resources-section" id="support-resources">
          <div className="container">
            <div className="section-header" style={{ textAlign: 'center' }}>
              <span className="section-tag">Support & Resources</span>
              <h2 className="section-title">Mental Health Support & Resources</h2>
              <div className="divider" style={{ margin: '0.75rem auto 1.25rem' }} />
              <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '720px' }}>
                Reaching out is a courageous step towards healing. Connect directly with our student peer support team or access verified 24x7 national emergency helplines.
              </p>
            </div>

            <div className="support-resources__grid">
              {/* Subsection A: I-Care We-Care Team */}
              <div className="support-resource-card">
                <div className="support-resource-card__header">
                  <div className="support-resource-card__header-top">
                    <span className="badge badge-lavender">COEP मित्र Peer Network</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>I-Care We-Care</span>
                  </div>
                  <h3 className="support-resource-card__title">I-Care We-Care Team</h3>
                  <p className="support-resource-card__desc">
                    Our dedicated student peer coordinators and volunteers are here to listen with empathy, maintain confidentiality, and support you every step of the way.
                  </p>
                </div>
                <div
                  className="support-resource-card__img-container"
                  onClick={() => setActiveModalImage({ src: icareTeamImg, alt: 'COEP मित्र I-Care We-Care Team' })}
                  role="button"
                  tabIndex={0}
                  aria-label="View I-Care We-Care Team poster in full size"
                  onKeyDown={(e) => { if (e.key === 'Enter') setActiveModalImage({ src: icareTeamImg, alt: 'COEP मित्र I-Care We-Care Team' }); }}
                >
                  <img
                    src={icareTeamImg}
                    alt="COEP मित्र I-Care We-Care Team poster with members and contact details"
                    className="support-resource-card__img"
                    loading="lazy"
                  />
                  <div className="support-resource-card__img-hint">
                    <span>🔍 Click to view full team poster</span>
                  </div>
                </div>
              </div>

              {/* Subsection B: National Helplines & Mental Health Support Information */}
              <div className="support-resource-card">
                <div className="support-resource-card__header">
                  <div className="support-resource-card__header-top">
                    <span className="badge badge-blue">Emergency Resources</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>24x7 Helplines</span>
                  </div>
                  <h3 className="support-resource-card__title">National Helplines & Mental Health Support</h3>
                  <p className="support-resource-card__desc">
                    Verified national helplines offering free, confidential, round-the-clock professional psychological and crisis intervention support across India.
                  </p>
                </div>
                <div
                  className="support-resource-card__img-container"
                  onClick={() => setActiveModalImage({ src: helplinesImg, alt: 'COEP Mental Health Helpline Guide' })}
                  role="button"
                  tabIndex={0}
                  aria-label="View National Helplines Guide in full size"
                  onKeyDown={(e) => { if (e.key === 'Enter') setActiveModalImage({ src: helplinesImg, alt: 'COEP Mental Health Helpline Guide' }); }}
                >
                  <img
                    src={helplinesImg}
                    alt="COEP Mental Health Helpline Guide showing Tele-MANAS, iCALL, Vandrevala Foundation, Connecting Trust, and MIMH"
                    className="support-resource-card__img"
                    loading="lazy"
                  />
                  <div className="support-resource-card__img-hint">
                    <span>🔍 Click to view full helpline guide</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── Section 2: Events & Activities ── */}
      <AnimatedSection>
        <section className="section public-events-section" id="events-activities">
          <div className="container">
            <div className="section-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                  <span className="section-tag">Campus Wellbeing</span>
                  <h2 className="section-title">Events & Activities</h2>
                  <div className="divider" />
                  <p className="section-subtitle">
                    Workshops, awareness sessions, and peer-led Wellbeing gatherings organised for the COEP campus community.
                  </p>
                </div>
                {user ? (
                  <Link to="/events" className="btn btn-secondary btn-sm">
                    View All in Calendar →
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-secondary btn-sm">
                    Sign in to Participate →
                  </Link>
                )}
              </div>
            </div>

            {eventsLoading ? (
              <div className="public-events__empty">
                <p>Loading events…</p>
              </div>
            ) : (
              <div className="public-events__content">
                {/* Status Tabs */}
                <div className="public-events__tabs-container">
                  <div className="public-events__tabs" role="tablist" aria-label="Event Status Tabs">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'ongoing'}
                      className={`public-events__tab-btn ${activeTab === 'ongoing' ? 'active' : ''}`}
                      onClick={() => setActiveTab('ongoing')}
                    >
                      {ongoingEvents.length > 0 && <span className="public-events__pulse-dot" style={{ margin: 0 }} />}
                      <span>Ongoing</span>
                      <span className="public-events__tab-count">{ongoingEvents.length}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'upcoming'}
                      className={`public-events__tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                      onClick={() => setActiveTab('upcoming')}
                    >
                      <span>Upcoming</span>
                      <span className="public-events__tab-count">{upcomingEvents.length}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'past'}
                      className={`public-events__tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                      onClick={() => setActiveTab('past')}
                    >
                      <span>Past Events</span>
                      <span className="public-events__tab-count">{pastEventsList.length}</span>
                    </button>
                  </div>
                </div>

                {/* Tab Panel: Ongoing */}
                {activeTab === 'ongoing' && (
                  <div className="public-events__tab-pane" role="tabpanel">
                    {ongoingEvents.length === 0 ? (
                      <div className="public-events__empty">
                        <p>No ongoing events right now.</p>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          Check our upcoming events tab for scheduled sessions.
                        </span>
                      </div>
                    ) : (
                      <div className="events-grid grid-responsive">
                        {ongoingEvents.map((ev) => (
                          <EventCard
                            key={ev._id || ev.id}
                            event={ev}
                            isRegistered={myRegistrations.some((r) => r.eventId === (ev._id || ev.id))}
                            onRegister={handleRegister}
                            registeringId={registeringId}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Panel: Upcoming */}
                {activeTab === 'upcoming' && (
                  <div className="public-events__tab-pane" role="tabpanel">
                    {upcomingEvents.length === 0 ? (
                      <div className="public-events__empty">
                        <p>No upcoming events posted right now.</p>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          The team will announce new sessions here soon - check back regularly.
                        </span>
                      </div>
                    ) : (
                      <div className="events-grid grid-responsive">
                        {upcomingEvents.map((ev) => (
                          <EventCard
                            key={ev._id || ev.id}
                            event={ev}
                            isRegistered={myRegistrations.some((r) => r.eventId === (ev._id || ev.id))}
                            onRegister={handleRegister}
                            registeringId={registeringId}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Panel: Past Events */}
                {activeTab === 'past' && (
                  <div className="public-events__tab-pane" role="tabpanel">
                    {pastEventsList.length === 0 ? (
                      <div className="public-events__empty">
                        <p>No past events recorded yet.</p>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          Completed campus sessions and workshop moments will appear here.
                        </span>
                      </div>
                    ) : (
                      <div className="events-grid grid-responsive">
                        {pastEventsList.map((ev) => (
                          <EventCard
                            key={ev._id || ev.id}
                            event={ev}
                            isRegistered={myRegistrations.some((r) => r.eventId === (ev._id || ev.id))}
                            onRegister={handleRegister}
                            registeringId={registeringId}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </AnimatedSection>

      {/* ── Challenge Banner ── */}
      <AnimatedSection>
        <section className="section challenge-banner">
          <div className="container">
            <div className="challenge-banner__inner glass">
              <div className="challenge-banner__content">
                <span className="badge badge-mint">Wellbeing Challenges</span>
                <h2 className="challenge-banner__title">Join a Challenge</h2>
                <p className="challenge-banner__sub">
                  Participate in Wellbeing challenges to build long-term healthy habits.
                  Login to track your personal progress.
                </p>
                <div className="challenge-banner__cta">
                  {user ? (
                    <Link to="/challenge" className="btn btn-primary">Explore Challenges</Link>
                  ) : (
                    <>
                      <Link to="/login" className="btn btn-primary">Access Challenges</Link>
                      <Link to="/register" className="btn btn-secondary">Create Account</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── Quote ── */}
      <AnimatedSection>
        <section className="section quote-section">
          <div className="container">
            <div className="quote-card glass-lavender">
              <div className="quote-mark">"</div>
              <blockquote className="quote-text">
                It is okay not to be okay. What matters is that you reach out, take one breath at a time,
                and know that support is always here.
              </blockquote>
              <cite className="quote-author">- COEP मित्र Wellness Team</cite>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── Lightbox Image Modal ── */}
      {activeModalImage && (
        <div className="support-lightbox-overlay" onClick={() => setActiveModalImage(null)}>
          <div className="support-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="support-lightbox-close"
              onClick={() => setActiveModalImage(null)}
              aria-label="Close image viewer"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            <img src={activeModalImage.src} alt={activeModalImage.alt} className="support-lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}
