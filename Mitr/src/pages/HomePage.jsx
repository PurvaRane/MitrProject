import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './HomePage.css';

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
  const { wellnessInfo, wellnessLoading } = useApp();

  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__blob hero__blob--1" />
        <div className="hero__blob hero__blob--2" />
        <div className="hero__blob hero__blob--3" />

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
              A safe, confidential, and supportive space — exclusively for COEP Technological University students.
            </p>
            <div className="hero__cta animate-fade-in-up delay-300">
              <Link to="/register" className="btn btn-primary">Join the Platform</Link>
              <Link to="/login" className="btn btn-secondary">Login to Portal</Link>
            </div>
          </div>

          <div className="hero__illustration animate-float">
            <div className="hero__svg-wrap">
              <svg viewBox="0 0 400 380" className="hero__svg" aria-hidden="true">
                <defs>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D6EAF8"/>
                    <stop offset="100%" stopColor="#E8DAEF"/>
                  </linearGradient>
                  <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A9DFBF"/>
                    <stop offset="100%" stopColor="#D5F5E3"/>
                  </linearGradient>
                </defs>
                <rect width="400" height="380" fill="url(#skyGrad)" rx="24"/>
                <circle cx="320" cy="80" r="42" fill="#FDEBD0" opacity="0.85"/>
                <ellipse cx="80" cy="90" rx="60" ry="22" fill="white" opacity="0.7"/>
                <ellipse cx="210" cy="100" rx="50" ry="18" fill="white" opacity="0.55"/>
                <ellipse cx="200" cy="270" rx="140" ry="38" fill="#AED6F1" opacity="0.75"/>
                <rect x="0" y="310" width="400" height="70" fill="url(#grassGrad)"/>
                <rect x="68" y="220" width="10" height="80" rx="4" fill="#6E6E6E" opacity="0.45"/>
                <ellipse cx="73" cy="210" rx="30" ry="35" fill="#52BE80" opacity="0.8"/>
                <ellipse cx="73" cy="200" rx="22" ry="25" fill="#A9DFBF"/>
                <rect x="302" y="230" width="10" height="70" rx="4" fill="#6E6E6E" opacity="0.45"/>
                <ellipse cx="307" cy="220" rx="28" ry="32" fill="#52BE80" opacity="0.75"/>
                <circle cx="200" cy="252" r="14" fill="#FADBD8" stroke="#F5B7B1" strokeWidth="2"/>
                <path d="M186 268 Q200 280 214 268 L216 305 Q200 312 184 305 Z" fill="#E8DAEF"/>
              </svg>
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
                  <p className="section-subtitle">COEP मित्र is the official mental health and wellbeing initiative of COEP Technological University. Login or register to access all features.</p>
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
              <div className="highlights__grid">
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

      {/* ── Challenge Banner ── */}
      <AnimatedSection>
        <section className="section challenge-banner">
          <div className="container">
            <div className="challenge-banner__inner glass">
              <div className="challenge-banner__content">
                <span className="badge badge-mint">30-Day Programme</span>
                <h2 className="challenge-banner__title">Mental Health Challenge</h2>
                <p className="challenge-banner__sub">
                  One structured self-care task per day — journaling, breathing, gratitude, and more.
                  Login to track your personal progress and streak.
                </p>
                <div className="challenge-banner__cta">
                  <Link to="/login" className="btn btn-primary">Access Challenge</Link>
                  <Link to="/register" className="btn btn-secondary">Create Account</Link>
                </div>
              </div>
              <div className="challenge-banner__progress">
                <div className="challenge-mini-days">
                  {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} className="challenge-mini-day">{i + 1}</div>
                  ))}
                </div>
                <p className="challenge-banner__streak">30 days of intentional wellbeing</p>
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
              <cite className="quote-author">— COEP मित्र Wellness Team</cite>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
