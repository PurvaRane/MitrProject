import React, { useState } from 'react';
import './OnboardingModal.css';

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const steps = [
    {
      title: 'Welcome to COEP मित्र',
      text: 'Your institutional companion for mental health and wellbeing. We\'re glad you\'re here.',
      icon: '🌿',
    },
    {
      title: 'Explore Wellness Events',
      text: 'Participate in workshops, seminars, and awareness sessions organized by the COEP Technological University Wellness Centre.',
      icon: '📅',
    },
    {
      title: 'Take the 30-Day Challenge',
      text: 'Engage in small, meaningful daily acts of self-care. Write reflections and track your journey.',
      icon: '✨',
    },
  ];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  const current = steps[step - 1];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal glass animate-scale-in">
        <div className="onboarding-modal__icon">{current.icon}</div>
        <h2 className="onboarding-modal__title">{current.title}</h2>
        <p className="onboarding-modal__text">{current.text}</p>
        
        <div className="onboarding-modal__dots">
          {[1, 2, 3].map(i => (
            <div key={i} className={`onboarding-modal__dot ${step === i ? 'active' : ''}`} />
          ))}
        </div>

        <button className="btn btn-primary onboarding-modal__btn" onClick={handleNext}>
          {step === totalSteps ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
