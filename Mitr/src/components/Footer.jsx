import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,90 1080,-10 1440,40 L1440,80 L0,80 Z" fill="rgba(214,234,248,0.4)"/>
        </svg>
      </div>

      <div className="footer__body container">
        <div className="footer__brand">
          <span className="footer__logo">COEP मित्र</span>
          <p className="footer__tagline">
            Every life is worth living,<br />every breath is worth saving.
          </p>
          <p className="footer__sub">Official Mental Health & Wellbeing Centre<br />COEP Technological University, Pune</p>
        </div>

        <div className="footer__links-group">
          <h4>Portal</h4>
          <Link to="/">Home</Link>
          <Link to="/events">Events</Link>
          <Link to="/challenge">Wellness Challenge</Link>
          <Link to="/reflect">Reflection Journal</Link>
          <Link to="/support">Support Information</Link>
        </div>

        <div className="footer__links-group">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </div>

      <div className="footer__bottom container">
        <p>© {new Date().getFullYear()} COEP मित्र · Wellness Centre</p>
        <p>A formal initiative for student wellbeing.</p>
      </div>
    </footer>
  );
}
