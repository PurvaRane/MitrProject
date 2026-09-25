import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { appointmentAPI } from '../api';
import './BookAppointment.css';

export default function BookAppointment() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const location = useLocation();
  const rescheduleId = new URLSearchParams(location.search).get('reschedule');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data
  const [counselor, setCounselor] = useState(null);
  const [monthAvailability, setMonthAvailability] = useState({});
  const [dateSlots, setDateSlots] = useState([]);

  // Selections
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [appointmentId, setAppointmentId] = useState('');

  // Student info (pre-filled from account, editable)
  const [studentMIS, setStudentMIS] = useState('');
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentBranch, setStudentBranch] = useState('');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchCounselor();
  }, []);

  // Pre-fill student info from account
  useEffect(() => {
    if (user) {
      setStudentMIS(user.misId || '');
      // Split name into first/last
      const parts = (user.name || '').trim().split(/\s+/);
      setStudentFirstName(parts[0] || '');
      setStudentLastName(parts.slice(1).join(' ') || '');
      setStudentBranch(user.branch || '');
    }
  }, [user]);

  useEffect(() => {
    fetchMonthAvailability(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const fetchCounselor = async () => {
    try {
      const res = await appointmentAPI.getCounselor();
      if (res.success) setCounselor(res.counselor);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMonthAvailability = async (year, month) => {
    setLoading(true);
    try {
      const res = await appointmentAPI.getAvailability(year, month);
      if (res.success) setMonthAvailability(res.availability);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDateSlots = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentAPI.getDateSlots(date);
      if (res.success) {
        setDateSlots(res.slots);
        setSelectedDate(date);
        setSelectedSlot(null);
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) return;
    if (!studentMIS || !studentFirstName || !studentLastName || !studentBranch) {
      setError('Please fill in all required details (MIS, First Name, Last Name, Branch).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let res;
      if (rescheduleId) {
        res = await appointmentAPI.reschedule(rescheduleId, {
          newDate: selectedDate,
          newStartTime: selectedSlot.startTime,
        });
      } else {
        res = await appointmentAPI.book({
          date: selectedDate,
          startTime: selectedSlot.startTime,
          reason,
          studentMIS,
          studentFirstName,
          studentLastName,
          studentBranch,
        });
      }
      if (res.success) {
        setAppointmentId(res.appointment.appointmentId);
        setStep(4);
      }
    } catch (err) {
      setError(err.message || 'Booking failed');
      // If double booking occurs, re-fetch slots
      if (err.status === 409) {
        fetchDateSlots(selectedDate);
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Calendar Rendering Helpers ──────────────────────────────────────────────
  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month - 1, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const todayStr = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10); // IST today

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
          className={`calendar-day ${statusClass} ${selectedDate === dateStr ? 'selected' : ''}`}
          disabled={isPast || statusClass !== 'available'}
          onClick={() => fetchDateSlots(dateStr)}
        >
          <span className="calendar-day-num">{d}</span>
          {statusClass === 'available' && <span className="calendar-day-dots">●</span>}
        </button>
      );
    }
    return grid;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const formatDisplayDate = (dateStr) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const BRANCH_OPTIONS = [
    'Computer Science and Engineering',
    'Electronics and Telecommunication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Instrumentation and Control Engineering',
    'Metallurgy and Materials Technology',
    'Manufacturing Science and Engineering',
    'AI/ML',
    'AI/DS',
  ];

  return (
    <div className="book-appointment-page">
      <div className="container">
        
        {/* Header */}
        <div className="book-header">
          <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="book-title">
            {rescheduleId ? 'Reschedule Appointment' : 'Book an Appointment'}
          </h1>
          {counselor && (
            <div className="counselor-mini">
              <strong>{counselor.name}</strong>
              <span>{counselor.designation}</span>
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="book-steps">
          {['Select Date', 'Choose Time', 'Your Details', 'Confirmed'].map((label, idx) => (
            <div key={label} className={`book-step-indicator ${step > idx + 1 ? 'done' : step === idx + 1 ? 'active' : ''}`}>
              <div className="book-step-circle">{step > idx + 1 ? '✓' : idx + 1}</div>
              <span className="book-step-label desktop-only">{label}</span>
            </div>
          ))}
        </div>

        {/* Error Toast */}
        {error && <div className="book-error glass-peach">{error}</div>}

        <div className="book-content grid-responsive">
          
          {/* LEFT: Calendar (Step 1) */}
          <div className={`book-card card ${step !== 1 && 'dimmed-on-mobile'}`}>
            <div className="book-step-header">
              <span className="step-num">1</span>
              <h2>Select a Date</h2>
            </div>
            
            <div className="calendar-widget">
              <div className="calendar-header">
                <button onClick={handlePrevMonth}>&lt;</button>
                <strong>{monthNames[currentMonth - 1]} {currentYear}</strong>
                <button onClick={handleNextMonth}>&gt;</button>
              </div>
              <div className="calendar-weekdays">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>
              <div className="calendar-grid">
                {renderCalendar()}
              </div>
              {loading && step === 1 && <div className="calendar-loading">Loading...</div>}
            </div>
            
            <div className="calendar-legend">
              <div><span className="dot dot-avail"></span> Available</div>
              <div><span className="dot dot-booked"></span> Full</div>
              <div><span className="dot dot-unavail"></span> Unavailable</div>
            </div>
          </div>

          {/* RIGHT: Dynamic flow (Steps 2-4) */}
          <div className="book-card card right-panel">
            
            {step === 1 && (
              <div className="empty-state">
                Please select an available date from the calendar to view time slots.
              </div>
            )}

            {step === 2 && (
              <div className="step-content animate-fade-in">
                <div className="book-step-header">
                  <span className="step-num">2</span>
                  <h2>Select Time Slot</h2>
                </div>
                <p className="step-sub">Available slots for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric'})}</p>
                
                <div className="slots-grid">
                  {dateSlots.filter(s => s.isBookable).length === 0 ? (
                    <p>No available slots for this date.</p>
                  ) : (
                    dateSlots.map(slot => (
                      <button
                        key={slot._id}
                        className={`slot-btn ${!slot.isBookable ? 'disabled' : ''} ${selectedSlot?._id === slot._id ? 'selected' : ''}`}
                        disabled={!slot.isBookable}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))
                  )}
                </div>

                {selectedSlot && (
                  <div className="step-actions">
                    <button className="btn btn-primary" onClick={() => setStep(3)}>Continue →</button>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="step-content animate-fade-in">
                <div className="book-step-header">
                  <span className="step-num">3</span>
                  <h2>Your Details</h2>
                </div>

                {/* Privacy Note */}
                <div className="privacy-note-block">
                  <div className="privacy-note-icon">🔒</div>
                  <div>
                    <strong>Your Privacy Matters</strong>
                    <p>
                      Your appointment information is kept confidential and is not displayed publicly.
                      For scheduling, the system uses your <em>MIS</em>, <em>initials</em>, and <em>Appointment ID</em>.
                      When you arrive, simply tell Dr. {counselor?.name?.split(' ').slice(1).join(' ') || 'Kshipra V. Moghe'} your Appointment ID.
                    </p>
                  </div>
                </div>

                {/* Appointment summary */}
                <div className="confirm-summary glass-baby-blue">
                  <div><strong>Date:</strong> {formatDisplayDate(selectedDate)}</div>
                  <div><strong>Time:</strong> {selectedSlot.startTime} – {selectedSlot.endTime}</div>
                  {counselor && <div><strong>Counselor:</strong> {counselor.name}</div>}
                </div>

                {/* Student Details Form */}
                <div className="student-details-form">
                  <h4 className="student-details-heading">Your Information</h4>
                  <p className="student-details-sub">Pre-filled from your account. Please verify before confirming.</p>

                  <div className="form-group">
                    <label className="form-label">MIS Number *</label>
                    <input
                      className="form-input"
                      value={studentMIS}
                      onChange={e => setStudentMIS(e.target.value)}
                      placeholder="Your 9-digit MIS"
                      maxLength={9}
                      readOnly
                      style={{ background: 'var(--off-white)', cursor: 'not-allowed', opacity: 0.8 }}
                    />
                    <span className="form-hint">MIS must match your registered account.</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">First Name *</label>
                      <input
                        className="form-input"
                        value={studentFirstName}
                        onChange={e => setStudentFirstName(e.target.value)}
                        placeholder="First Name"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Last Name *</label>
                      <input
                        className="form-input"
                        value={studentLastName}
                        onChange={e => setStudentLastName(e.target.value)}
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Branch *</label>
                    <select
                      className="form-input"
                      value={studentBranch}
                      onChange={e => setStudentBranch(e.target.value)}
                      required
                    >
                      <option value="">Select your branch</option>
                      {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reason for Appointment <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                    <textarea
                      className="form-input"
                      rows="3"
                      placeholder="Briefly describe what you'd like to discuss..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                </div>

                <div className="step-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn btn-mint"
                    onClick={handleBooking}
                    disabled={loading || !studentMIS || !studentFirstName || !studentLastName || !studentBranch}
                  >
                    {loading ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="step-content text-center animate-fade-in">
                <div className="success-icon">✓</div>
                <h2 className="success-title">Appointment Confirmed!</h2>
                <p className="success-sub">
                  Your appointment has been successfully {rescheduleId ? 'rescheduled' : 'booked'} with Dr. {counselor?.name?.split(' ').slice(1).join(' ') || 'Kshipra V. Moghe'}.
                </p>
                
                <div className="ticket glass-mint">
                  <div className="ticket-label">Your Appointment ID</div>
                  <div className="ticket-id">{appointmentId}</div>
                  <div className="ticket-divider" />
                  <div className="ticket-detail"><strong>Date:</strong> {formatDisplayDate(selectedDate)}</div>
                  <div className="ticket-detail"><strong>Time:</strong> {selectedSlot?.startTime} – {selectedSlot?.endTime}</div>
                  <div className="ticket-detail"><strong>Counselor:</strong> {counselor?.name}</div>
                </div>

                <div className="appt-instructions card glass-blue">
                  <div className="appt-instructions-icon">💡</div>
                  <div>
                    <strong>When you arrive for your appointment:</strong>
                    <p>
                      Simply tell <strong>Dr. {counselor?.name?.split(' ').slice(1).join(' ') || 'Kshipra V. Moghe'}</strong> your Appointment ID: <strong className="appt-id-inline">{appointmentId}</strong>
                    </p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Your full name is not displayed in the public schedule - only your initials and appointment ID are used.
                    </p>
                  </div>
                </div>

                <div className="mt-2xl">
                  <button className="btn btn-primary" onClick={() => navigate('/user-dashboard')}>Go to Dashboard</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
