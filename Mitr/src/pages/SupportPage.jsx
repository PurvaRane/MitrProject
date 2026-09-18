import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AuthContext } from '../App';
import { appointmentAPI } from '../api';
import './SupportPage.css';

export default function SupportPage() {
  const { wellnessInfo, wellnessLoading } = useApp();
  const { user } = useContext(AuthContext);
  const [counselor, setCounselor] = useState(null);

  useEffect(() => {
    const fetchCounselor = async () => {
      try {
        const res = await appointmentAPI.getCounselor();
        if (res.success) setCounselor(res.counselor);
      } catch (err) {
        console.error('Failed to fetch counselor', err);
      }
    };
    fetchCounselor();
  }, []);

  return (
    <div className="support-page">
      {/* Header */}
      <div className="support-header">
        <div className="container">
          <span className="section-tag">Support</span>
          <h1 className="section-title">COEP मित्र Support</h1>
          <div className="divider" />
          <p className="section-subtitle">
            Reaching out is an act of courage. COEP मित्र is here to support you.
          </p>
        </div>
      </div>

      {/* Wellness info from DB */}
      <section className="section container">
        {wellnessLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : wellnessInfo ? (
          <div className="card support-info-card">
            <h2 className="support-info-card__title">{wellnessInfo.title}</h2>
            <p className="support-info-card__desc">{wellnessInfo.description}</p>
            {wellnessInfo.vision && (
              <div className="support-info-card__vision glass-blue">
                <strong>Our Vision</strong>
                <p>{wellnessInfo.vision}</p>
              </div>
            )}
            {wellnessInfo.services?.length > 0 && (
              <div className="support-services">
                <h3 className="support-services__title">Available Services</h3>
                <div className="support-services__grid grid-responsive">
                  {wellnessInfo.services.map((s, i) => (
                    <div key={i} className="support-service-card card">
                      <div className="support-service-card__title">{s.title}</div>
                      {s.description && <div className="support-service-card__desc">{s.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card support-info-card">
            <h2 className="support-info-card__title">About COEP मित्र</h2>
            <p className="support-info-card__desc">
              COEP मित्र is the official mental health and wellbeing platform of COEP Technological University.
              Content is updated by the Wellness Centre administrator. Please check back soon.
            </p>
          </div>
        )}
      </section>

      {/* Counselor Card */}
      {counselor && (
        <section className="section container">
          <div className="card counselor-card">
            <div className="counselor-card__content">
              <div className="counselor-card__header">
                <span className="section-tag">Professional Support</span>
                <h2 className="counselor-card__name">{counselor.name}</h2>
                <p className="counselor-card__designation">{counselor.designation}</p>
                <p className="counselor-card__role">{counselor.role}</p>
              </div>
              
              <div className="counselor-card__details">
                <div className="counselor-card__detail">
                  <strong>Department:</strong> {counselor.department}
                </div>
                <div className="counselor-card__detail">
                  <strong>Institution:</strong> {counselor.institution}
                </div>
                <div className="counselor-card__detail">
                  <strong>Email:</strong> {counselor.email}
                </div>
              </div>
            </div>
            
            <div className="counselor-card__actions">
              <p className="counselor-card__note">Confidential one-on-one sessions are available for all enrolled students.</p>
              {user ? (
                <Link to="/book-appointment" className="btn btn-primary w-full text-center" style={{ display: 'block' }}>Book an Appointment</Link>
              ) : (
                <Link to="/login" className="btn btn-secondary w-full text-center" style={{ display: 'block' }}>Login to Book</Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section" style={{ background: 'linear-gradient(180deg, white 0%, var(--baby-blue) 100%)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 560, marginInline: 'auto' }}>
          <span className="section-tag">Get Started</span>
          <h2 className="section-title">Join the Platform</h2>
          <div className="divider" style={{ margin: '0 auto var(--space-xl)' }} />
          <p className="section-subtitle" style={{ marginBottom: 'var(--space-xl)' }}>
            Register with your COEP MIS number to access well-being challenges, events, and your personal reflection journal.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary">Create Account</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
