import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './EventsPage.css';

const FILTERS = ['All', 'Workshop', 'Awareness', 'Challenge', 'Seminar', 'Other'];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getDaysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const CATEGORY_BADGE = {
  Workshop:  'badge-blue',
  Awareness: 'badge-lavender',
  Challenge: 'badge-mint',
  Seminar:   'badge-peach',
  Other:     'badge-mint',
};

export default function EventsPage() {
  const { events, eventsLoading, fetchEvents } = useApp();
  const [filter, setFilter]       = useState('All');
  const [registered, setRegistered] = useState({});
  const [fetchError, setFetchError] = useState(null);

  // Re-fetch from API every time the category filter changes
  useEffect(() => {
    setFetchError(null);
    fetchEvents(filter === 'All' ? undefined : filter).catch(err => {
      console.error('[EventsPage] fetchEvents error:', err);
      setFetchError('Could not load events. Please check your connection.');
    });
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = events.filter(e => filter === 'All' || e.category === filter);

  return (
    <div className="events-page">
      {/* Header */}
      <div className="events-header">
        <div className="container">
          <span className="section-tag">Wellbeing Events</span>
          <h1 className="section-title">Calendar of Care</h1>
          <div className="divider" />
          <p className="section-subtitle">
            Workshops, awareness sessions, and challenges — designed to nurture your wellbeing.
          </p>

          {/* Filters */}
          <div className="events-filters" role="group" aria-label="Filter events">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`events-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events grid */}
      <section className="section events-section container">
        <div className="events-section__header">
          <h2 className="events-section__title">Upcoming Events</h2>
          <span className="badge badge-mint">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {fetchError && (
          <div className="events-error" role="alert">
            ⚠️ {fetchError}
          </div>
        )}

        {eventsLoading ? (
          <div className="events-loading">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="events-empty events-empty--big">
            <div className="events-empty__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <p>No events have been published yet.</p>
            <p className="events-empty__note">The admin will post upcoming events here — check back soon.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="events-empty">
            <p>No <strong>{filter}</strong> events right now. Check back soon.</p>
          </div>
        ) : (
          <div className="events-grid">
            {filtered.map((ev) => {
              const days  = getDaysUntil(ev.date);
              const badge = CATEGORY_BADGE[ev.category] || 'badge-blue';
              const isReg = !!registered[ev._id || ev.id];

              return (
                <div key={ev._id || ev.id} className="event-card card">
                  {/* Image or gradient placeholder */}
                  {(ev.imageUrl || ev.image) ? (
                    <div className="event-card__img-wrap">
                      <img src={ev.imageUrl || ev.image} alt={ev.title} className="event-card__img" />
                    </div>
                  ) : (
                    <div className={`event-card__placeholder event-card__placeholder--${ev.category?.toLowerCase()}`} />
                  )}

                  <div className="event-card__body">
                    <div className="event-card__top">
                      <span className={`badge ${badge}`}>{ev.category}</span>
                      {days === 0
                        ? <span className="countdown-today">Today</span>
                        : <span className="countdown-days"><strong>{days}</strong> days away</span>
                      }
                    </div>

                    <h3 className="event-card__title">{ev.title}</h3>
                    {ev.description && (
                      <p className="event-card__desc">{ev.description}</p>
                    )}

                    <div className="event-card__meta">
                      <span>{formatDate(ev.date)}</span>
                    </div>

                    <button
                      className={`btn btn-sm ${isReg ? 'btn-mint' : 'btn-primary'}`}
                      onClick={() => setRegistered(r => ({ ...r, [ev._id || ev.id]: true }))}
                      disabled={isReg}
                    >
                      {isReg ? 'Registered' : 'Register Interest'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
