import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './SupportPage.css';

export default function SupportPage() {
  const { wellnessInfo, wellnessLoading } = useApp();

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
                <div className="support-services__grid">
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

      {/* CTA */}
      <section className="section" style={{ background: 'linear-gradient(180deg, white 0%, var(--baby-blue) 100%)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 560, marginInline: 'auto' }}>
          <span className="section-tag">Get Started</span>
          <h2 className="section-title">Join the Platform</h2>
          <div className="divider" style={{ margin: '0 auto var(--space-xl)' }} />
          <p className="section-subtitle" style={{ marginBottom: 'var(--space-xl)' }}>
            Register with your COEP MIS number to access the 30-day wellness challenge, events, and your personal reflection journal.
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
