import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { appointmentAPI } from '../api';
import './MyAppointments.css';

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentAPI.getMyAppointments();
      if (res.success) setAppointments({ upcoming: res.upcoming, past: res.past });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await appointmentAPI.cancel(id);
      if (res.success) {
        alert('Appointment cancelled.');
        fetchAppointments();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  const handleReschedule = (id) => {
    navigate(`/book-appointment?reschedule=${id}`);
  };

  const formatDateDisplay = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="my-appointments-page">
      <div className="container">
        <div className="my-appts-header">
          <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="my-appts-title">My Appointments</h1>
          <p className="my-appts-sub">Your wellbeing matters. Keep track of your sessions here.</p>
        </div>

        <button className="btn btn-mint btn-full-width" onClick={() => navigate('/book-appointment')}>
          + Book New
        </button>

        <div className="my-appts-tabs">
          <button 
            className={`tab-btn ${tab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setTab('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`tab-btn ${tab === 'past' ? 'active' : ''}`}
            onClick={() => setTab('past')}
          >
            Past
          </button>
        </div>

        {loading ? (
          <div className="ud-loading">Loading...</div>
        ) : (
          <div className="my-appts-list">
            {appointments[tab].length === 0 ? (
              <div className="card empty-state text-center">
                <p>No {tab} appointments found.</p>
              </div>
            ) : (
              appointments[tab].map(appt => (
                <div key={appt._id} className="card appt-card animate-fade-in">
                  <div className="appt-card-top">
                    <div className="appt-card-date-icon">📅</div>
                    <div className="appt-card-info">
                      <div className="appt-datetime">
                        {formatDateDisplay(appt.date)} at {appt.startTime}
                      </div>
                      <div className="appt-counselor">Counselor Session</div>
                      <div className="appt-id">ID: <strong>{appt.appointmentId}</strong></div>
                    </div>
                    <div className={`badge badge-${appt.status === 'confirmed' ? 'mint' : appt.status === 'rejected' ? 'peach' : 'blue'}`}>
                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </div>
                  </div>

                  <div className="appt-card-actions">
                    <button className="btn-action view-details" onClick={() => alert('Appointment ID: ' + appt.appointmentId + '\\nReason: ' + appt.reason)}>
                      👁 View Details
                    </button>
                    {(appt.status === 'confirmed' || appt.status === 'rejected') && tab === 'upcoming' && (
                      <>
                        <button className="btn-action reschedule" onClick={() => handleReschedule(appt._id)}>
                          📅 Reschedule
                        </button>
                        <button className="btn-action cancel" onClick={() => handleCancel(appt._id)}>
                          🗑 Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
