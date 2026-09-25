import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AuthContext } from '../App';
import { appointmentAPI, teamAPI } from '../api';
import './SupportPage.css';

const DEFAULT_COUNSELOR = {
  counselorId: 'dr-kshipra-moghe',
  name: 'Dr. Kshipra V. Moghe',
  role: 'Nodal Officer & Incharge – Mental Health & Wellbeing Initiative: COEP "मित्र"',
  designation: 'Asst. Professor – Psychology & Consulting Psychologist',
  department: 'Department of Applied Sciences & Humanities',
  institution: 'COEP Tech, Pune',
  email: 'kam.appsci@coeptech.ac.in',
};

const DEFAULT_TEAM = [
  { _id: '1', name: 'Yash', phone: '8999893770', email: 'yashmore2428@gmail.com' },
  { _id: '2', name: 'Sakshi', phone: '9403371329', email: 'sakshib.200512@gmail.com' },
  { _id: '3', name: 'Purva', phone: '8530062608', email: 'purvarane.2623@gmail.com' },
  { _id: '4', name: 'Om', phone: '7350909448', email: 'omitrawellness@gmail.com' },
  { _id: '5', name: 'Ritu', phone: '9011939795', email: 'ritu.kars23@gmail.com' },
  { _id: '6', name: 'Ishwari', phone: '9809095666', email: 'ishwari0720@gmail.com' },
];

export default function SupportPage() {
  const { wellnessInfo, wellnessLoading } = useApp();
  const { user } = useContext(AuthContext);
  const [counselor, setCounselor] = useState(DEFAULT_COUNSELOR);
  const [team, setTeam] = useState(DEFAULT_TEAM);
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => {
    const fetchCounselor = async () => {
      try {
        const res = await appointmentAPI.getCounselor();
        if (res.success && res.counselor) setCounselor(res.counselor);
      } catch (err) {
        console.error('Failed to fetch counselor', err);
      }
    };

    const fetchTeam = async () => {
      try {
        const res = await teamAPI.getPublic();
        if (res.success && res.members?.length > 0) setTeam(res.members);
      } catch (err) {
        console.error('Failed to fetch team', err);
      } finally {
        setTeamLoading(false);
      }
    };

    fetchCounselor();
    fetchTeam();
  }, []);

  // Avatar initials helper
  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Cycle avatar colours for the team cards
  const AVATAR_COLORS = [
    { bg: 'rgba(214,234,248,0.85)', color: '#1A5276' },
    { bg: 'rgba(232,218,239,0.85)', color: '#6C3483' },
    { bg: 'rgba(213,245,227,0.85)', color: '#1E8449' },
    { bg: 'rgba(250,219,216,0.85)', color: '#922B21' },
    { bg: 'rgba(254,249,231,0.85)', color: '#7D6608' },
    { bg: 'rgba(174,214,241,0.7)',  color: '#154360' },
  ];

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
        <section className="section container" style={{ paddingTop: 0 }}>
          <div className="support-section-header">
            <span className="section-tag">Professional Support</span>
            <h2 className="support-section-title">Need Someone to Talk To?</h2>
          </div>
          <div className="card counselor-card">
            <div className="counselor-avatar-col">
              <div className="counselor-avatar">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
            </div>
            <div className="counselor-card__content">
              <div className="counselor-card__header">
                <h2 className="counselor-card__name">{counselor.name}</h2>
                <p className="counselor-card__designation">{counselor.designation}</p>
                <p className="counselor-card__role">{counselor.role}</p>
              </div>
              
              <div className="counselor-card__details">
                <div className="counselor-card__detail">
                  <span className="counselor-detail-icon">🏛️</span>
                  <span><strong>Department:</strong> {counselor.department}</span>
                </div>
                <div className="counselor-card__detail">
                  <span className="counselor-detail-icon">🎓</span>
                  <span><strong>Institution:</strong> {counselor.institution}</span>
                </div>
                <div className="counselor-card__detail">
                  <span className="counselor-detail-icon">✉️</span>
                  <span>
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${counselor.email}`} className="counselor-email-link">
                      {counselor.email}
                    </a>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="counselor-card__actions">
              <p className="counselor-card__note">
                Confidential one-on-one sessions are available for all enrolled COEP Tech students.
              </p>
              {user ? (
                <Link to="/book-appointment" className="btn btn-primary w-full text-center" style={{ display: 'block' }}>
                  Book an Appointment
                </Link>
              ) : (
                <Link to="/login" className="btn btn-secondary w-full text-center" style={{ display: 'block' }}>
                  Login to Book
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* I-Care We-Care Team */}
      <section className="section icare-section">
        <div className="container">
          <div className="icare-header">
            <span className="section-tag">Peer Support</span>
            <h2 className="icare-title">Meet the I-Care We-Care Team</h2>
            <div className="divider" />
            <p className="icare-subtitle">
              The I-Care We-Care team is a group of fellow students trained to provide peer support
              and guide you towards the right resources within COEP मित्र.
            </p>
          </div>

          {teamLoading ? (
            <div className="icare-loading">
              <div className="icare-loading-dots">
                <span /><span /><span />
              </div>
              <p>Loading team…</p>
            </div>
          ) : team.length === 0 ? (
            <div className="card icare-empty">
              <p>Team information will be available soon.</p>
            </div>
          ) : (
            <div className="icare-grid">
              {team.map((member, i) => {
                const colorSet = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <div key={member._id} className="icare-card animate-fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
                    <div
                      className="icare-card__avatar"
                      style={{ background: colorSet.bg, color: colorSet.color }}
                    >
                      {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.name} className="icare-card__avatar-img" />
                      ) : (
                        <span className="icare-card__initials">{getInitials(member.name)}</span>
                      )}
                    </div>
                    <div className="icare-card__body">
                      <h3 className="icare-card__name">{member.name}</h3>
                      <div className="icare-card__contacts">
                        {member.phone && (
                          <a href={`tel:${member.phone}`} className="icare-contact-row icare-contact-phone">
                            <span className="icare-contact-icon">📞</span>
                            <span>{member.phone}</span>
                          </a>
                        )}
                        {member.email && (
                          <a href={`mailto:${member.email}`} className="icare-contact-row icare-contact-email">
                            <span className="icare-contact-icon">✉️</span>
                            <span>{member.email}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="icare-note card glass-blue">
            <span className="icare-note-icon">💙</span>
            <p>
              The I-Care We-Care team is here to listen. Reach out to any team member directly,
              or book an appointment with Dr. Kshipra V. Moghe for professional support.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'linear-gradient(180deg, white 0%, var(--baby-blue) 100%)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 560, marginInline: 'auto' }}>
          <span className="section-tag">Get Started</span>
          <h2 className="section-title">Join the Platform</h2>
          <div className="divider" style={{ margin: '0 auto var(--space-xl)' }} />
          <p className="section-subtitle" style={{ marginBottom: 'var(--space-xl)' }}>
            Register with your COEP MIS number to access wellbeing challenges, events, and your personal reflection journal.
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
