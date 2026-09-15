import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { appointmentAPI } from '../api';
import './BookAppointment.css';

export default function BookAppointment() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchCounselor();
  }, []);

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
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentAPI.book({
        date: selectedDate,
        startTime: selectedSlot.startTime,
        reason,
      });
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

  return (
    <div className="book-appointment-page">
      <div className="container">
        
        {/* Header */}
        <div className="book-header">
          <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="book-title">Book an Appointment</h1>
          {counselor && (
            <div className="counselor-mini">
              <strong>{counselor.name}</strong>
              <span>{counselor.designation}</span>
            </div>
          )}
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
                <p className="step-sub">Available slots for {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric'})}</p>
                
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
                  <h2>Confirm Details</h2>
                </div>
                
                <div className="confirm-summary glass-baby-blue">
                  <div><strong>Date:</strong> {selectedDate}</div>
                  <div><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</div>
                  <div><strong>Student:</strong> {user?.name} ({user?.misId})</div>
                </div>

                <div className="form-group mt-xl">
                  <label>Reason for Appointment (Optional)</label>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Briefly describe what you'd like to discuss..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  ></textarea>
                </div>

                <div className="step-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-mint" onClick={handleBooking} disabled={loading}>
                    {loading ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="step-content text-center animate-fade-in">
                <div className="success-icon">✓</div>
                <h2 className="success-title">Appointment Confirmed!</h2>
                <p className="success-sub">Your appointment has been successfully booked.</p>
                
                <div className="ticket glass-mint">
                  <div className="ticket-id">ID: {appointmentId}</div>
                  <div className="ticket-detail"><strong>Date:</strong> {selectedDate}</div>
                  <div className="ticket-detail"><strong>Time:</strong> {selectedSlot?.startTime}</div>
                  <div className="ticket-detail"><strong>Counselor:</strong> {counselor?.name}</div>
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
