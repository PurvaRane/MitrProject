import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { AuthContext } from '../App';
import '../pages/EventsPage.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const normalized = typeof dateStr === 'string' && dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr;
  return new Date(normalized).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getDaysUntil(dateStr) {
  if (!dateStr) return 0;
  const normalized = typeof dateStr === 'string' && dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr;
  const target = new Date(normalized);
  const now = new Date();
  const dTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = dTarget - dNow;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

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

const CATEGORY_BADGE = {
  Workshop:  'badge-blue',
  Awareness: 'badge-lavender',
  Challenge: 'badge-mint',
  Seminar:   'badge-peach',
  Other:     'badge-mint',
};

export default function EventCard({ event: ev, isRegistered = false, onRegister, registeringId }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const days = getDaysUntil(ev.date);
  const badge = CATEGORY_BADGE[ev.category] || 'badge-blue';
  const isPast = ev.status === 'Completed' || (!isEventToday(ev.date) && !isEventFuture(ev.date) && ev.status !== 'Ongoing');
  const isOngoing = !isPast && (ev.status === 'Ongoing' || days === 0);
  const eventId = ev._id || ev.id;
  const isPending = registeringId === eventId;

  const handleCardClick = () => {
    if (!user) {
      navigate('/login');
    }
  };

  const handleAction = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (onRegister) {
      onRegister(eventId, isRegistered);
    }
  };

  const handleKeyDown = (e) => {
    if (!user && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      navigate('/login');
    }
  };

  return (
    <div
      className={`event-card card ${!user ? 'event-card--clickable' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={!user ? 'button' : undefined}
      tabIndex={!user ? 0 : undefined}
      aria-label={!user ? `${ev.title} - Login to register or view details` : undefined}
    >
      {(ev.imageUrl || ev.image) ? (
        <div className="event-card__img-wrap">
          <img src={ev.imageUrl || ev.image} alt={ev.title} className="event-card__img" />
        </div>
      ) : (
        <div className={`event-card__placeholder event-card__placeholder--${ev.category?.toLowerCase() || 'workshop'}`} />
      )}

      <div className="event-card__body">
        <div className="event-card__top">
          <span className={`badge ${badge}`}>{ev.category}</span>
          {isPast ? (
            <span className="badge badge-peach">Concluded</span>
          ) : isOngoing ? (
            <span className="countdown-today" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--mint-deep, #10b981)',
                }}
              />
              {ev.status === 'Ongoing' ? 'Ongoing' : 'Today'}
            </span>
          ) : (
            <span className="countdown-days">
              <strong>{days}</strong> {days === 1 ? 'day' : 'days'} away
            </span>
          )}
        </div>

        <h3 className="event-card__title">{ev.title}</h3>
        {ev.description && (
          <p className="event-card__desc">{ev.description}</p>
        )}

        <div className="event-card__footer">
          <div className="event-card__meta">
            <span><CalendarDays size={18} strokeWidth={2} /> {formatDate(ev.date)}</span>
          </div>

          {isPast ? (
            <span className="badge badge-lavender" style={{ alignSelf: 'flex-start', padding: '0.35rem 0.85rem' }}>
              Event Concluded
            </span>
          ) : ev.registrationRequired ? (
            <button
              type="button"
              className={`btn btn-sm ${isRegistered ? 'btn-peach' : 'btn-primary'} event-card__btn`}
              onClick={handleAction}
              disabled={isPending}
            >
              {isPending ? '...' : isRegistered ? 'Cancel Registration' : 'Register Interest'}
            </button>
          ) : (
            <span className="badge badge-lavender" style={{ alignSelf: 'flex-start', padding: '0.35rem 0.85rem' }}>
              No Registration Required
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
