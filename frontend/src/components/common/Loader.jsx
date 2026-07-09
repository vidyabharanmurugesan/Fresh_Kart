import React, { useState, useEffect } from 'react';

export default function Loader({ size = 'lg', text = '' }) {
  // Strip trailing dots from the text prop if they exist
  const initialText = text ? text.replace(/\.+$/, '') : 'Preparing your order';

  const messages = [
    initialText,
    'Sourcing fresh organic produce',
    'Checking quality and freshness standards',
    'Packing your green basket with care',
    'Assigning the fastest delivery route',
    'FreshKart is almost ready'
  ];

  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in');

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('fade-out');
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % messages.length);
        setFadeState('fade-in');
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length]);

  const brandName = "FreshKart";

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;800&display=swap');

    body {
      margin: 0;
      background-color: var(--color-dark-bg);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .loader-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, rgba(16, 185, 129, 0.12) 0%, var(--color-dark-bg) 100%);
    }

    .loader-card {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-xl);
      padding: var(--space-12) var(--space-10);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 420px;
      width: 90%;
      text-align: center;
      position: relative;
    }

    .spinner-wrapper {
      position: relative;
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-6);
    }

    .ring-outer {
      position: absolute;
      width: 110px;
      height: 110px;
      border: 4px solid transparent;
      border-top: 4px solid var(--color-primary);
      border-bottom: 4px solid var(--color-primary-dark);
      border-radius: 50%;
      animation: spin-clockwise 2.5s cubic-bezier(0.53, 0.21, 0.29, 0.67) infinite;
      filter: drop-shadow(0 0 10px var(--color-primary));
    }

    .ring-middle {
      position: absolute;
      width: 86px;
      height: 86px;
      border: 3px solid transparent;
      border-left: 3px solid var(--color-accent);
      border-right: 3px solid var(--color-accent-dark);
      border-radius: 50%;
      animation: spin-counter 1.8s cubic-bezier(0.53, 0.21, 0.29, 0.67) infinite;
      filter: drop-shadow(0 0 8px var(--color-accent));
    }

    .ring-inner {
      position: absolute;
      width: 62px;
      height: 62px;
      border: 2px dashed var(--color-primary-light);
      opacity: 0.25;
      border-radius: 50%;
      animation: spin-clockwise 6s linear infinite;
    }

    .center-icon-container {
      position: absolute;
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-white);
      box-shadow: 0 4px 15px var(--color-primary);
      animation: pulse-glow 2s ease-in-out infinite;
    }

    .floating-item {
      position: absolute;
      width: 24px;
      height: 24px;
      pointer-events: none;
      opacity: 0;
    }

    .floating-carrot {
      animation: float-up-carrot 3.5s ease-in-out infinite;
      animation-delay: 0.2s;
    }

    .floating-apple {
      animation: float-up-apple 3.2s ease-in-out infinite;
      animation-delay: 1.2s;
    }

    .floating-leaf {
      animation: float-up-leaf 3.8s ease-in-out infinite;
      animation-delay: 2.2s;
    }

    @keyframes spin-clockwise {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes spin-counter {
      0% { transform: rotate(360deg); }
      100% { transform: rotate(0deg); }
    }

    @keyframes pulse-glow {
      0%, 100% { transform: scale(1); box-shadow: 0 4px 15px var(--color-primary); }
      50% { transform: scale(1.08); box-shadow: 0 4px 25px var(--color-primary); }
    }

    @keyframes float-up-carrot {
      0% { transform: translate(-35px, 40px) scale(0.5) rotate(0deg); opacity: 0; }
      20% { opacity: 0.8; }
      80% { opacity: 0.8; }
      100% { transform: translate(-65px, -60px) scale(1) rotate(120deg); opacity: 0; }
    }

    @keyframes float-up-apple {
      0% { transform: translate(35px, 30px) scale(0.5) rotate(0deg); opacity: 0; }
      20% { opacity: 0.8; }
      80% { opacity: 0.8; }
      100% { transform: translate(65px, -70px) scale(1) rotate(-90deg); opacity: 0; }
    }

    @keyframes float-up-leaf {
      0% { transform: translate(0px, 45px) scale(0.5) rotate(0deg); opacity: 0; }
      20% { opacity: 0.8; }
      80% { opacity: 0.8; }
      100% { transform: translate(15px, -90px) scale(0.9) rotate(180deg); opacity: 0; }
    }

    .brand-text-container {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      display: flex;
      gap: 2px;
      justify-content: center;
      margin-bottom: var(--space-2);
    }

    .brand-text-container span {
      display: inline-block;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: letter-wave 2s ease-in-out infinite;
    }

    @keyframes letter-wave {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .subtitle {
      font-size: 0.95rem;
      color: var(--color-gray-400);
      font-weight: var(--font-weight-medium);
      margin-top: var(--space-2);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      min-height: 24px;
    }

    .subtitle-text {
      transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
      display: inline-block;
    }

    .subtitle-text.fade-in {
      opacity: 1;
      transform: translateY(0);
    }

    .subtitle-text.fade-out {
      opacity: 0;
      transform: translateY(-5px);
    }

    .dot { animation: fade-dot 1.4s infinite; opacity: 0; }
    .dot:nth-child(1) { animation-delay: 0s; }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes fade-dot {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }

    .reveal-wrapper {
      opacity: 0;
      animation: smooth-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .delay-1 { animation-delay: 0.1s; }
    .delay-2 { animation-delay: 0.3s; }
    .delay-3 { animation-delay: 0.5s; }

    @keyframes smooth-reveal {
      0% { opacity: 0; transform: translateY(25px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;

  return (
    <div className="loader-bg">
      <style>{styles}</style>
      <div className="loader-card reveal-wrapper delay-1">
        
        {/* Floating grocery items */}
        <div className="floating-item floating-carrot">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2c-.5.5-.8 1.2-1 2C8 6.5 4.5 11 3 14c-.6 1.2-.5 2.5.5 3.5s2.3 1.1 3.5.5c3-1.5 7.5-5 10-8 1-.2 1.5-.5 2-1s-.3-1.5-1-2c-.5-.5-1.5-.7-2-1L12 2z" fill="var(--color-accent)"/>
            <path d="M17 3c-.5 0-1 .5-1 1s1.5 2 2 2c.5 0 1-.5 1-1s-1.5-2-2-2z" fill="var(--color-primary)"/>
          </svg>
        </div>
        <div className="floating-item floating-apple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5c-1.5-1.5-4-1.5-5.5 0A4 4 0 0 0 6 11c0 3 3.5 6 6 8c2.5-2 6-5 6-8a4 4 0 0 0-.5-6c-1.5-1.5-4-1.5-5.5 0z" fill="var(--color-error)"/>
            <path d="M12 5c0-1.5 1-2.5 2-3" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="floating-item floating-leaf">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M17 3c-4 0-8 4-9 8c-.6 2.3.2 4.6 2 6c2-2.3 4.3-5 5.5-8c.5-1.2.5-2.5 1.5-3.5a3 3 0 0 1 0 4c-1 1-2.3 1-3.5 1.5c-3 1.2-5.7 3.5-8 5.5c1.4 1.8 3.7 2.6 6 2c4-1 8-5 8-9a6 6 0 0 0-6-6z" fill="var(--color-primary)"/>
          </svg>
        </div>

        {/* Concentric rings spinner */}
        <div className="spinner-wrapper">
          <div className="ring-outer"></div>
          <div className="ring-middle"></div>
          <div className="ring-inner"></div>
          <div className="center-icon-container">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
        </div>

        {/* Brand Text with Staggered Entrance Wave */}
        <div className="reveal-wrapper delay-2">
          <div className="brand-text-container select-none">
            {brandName.split('').map((char, index) => (
              <span key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Cycling Subtitle with Fade effect */}
        <div className="reveal-wrapper delay-3">
          <div className="subtitle select-none">
            <span className={`subtitle-text ${fadeState}`}>
              {messages[msgIndex]}
            </span>
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
