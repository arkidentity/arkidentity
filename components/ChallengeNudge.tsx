'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Auto-triggers a challenge nudge popup 2 seconds after load
 * if user hasn't registered for the 3D Challenge and hasn't
 * been shown the nudge today.
 */
export function ChallengeNudge() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem('ark_challenge_nudge_dismissed', new Date().toDateString());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only show on main app pages
    if (['/login', '/reset-password', '/auth', '/about', '/team', '/beliefs', '/giving'].some(p => pathname.startsWith(p))) return;

    // Don't show if already registered
    const registered = localStorage.getItem('ark_challenge_registered');
    if (registered) return;

    // Don't show if dismissed today
    const today = new Date().toDateString();
    if (localStorage.getItem('ark_challenge_nudge_dismissed') === today) return;

    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="challenge-nudge-overlay" onClick={dismiss}>
      <div className="challenge-nudge" onClick={e => e.stopPropagation()}>
        <button className="challenge-nudge-close" onClick={dismiss} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="challenge-nudge-header">
          <span className="challenge-nudge-emoji">🔥</span>
          <h2>The 3D Bible Challenge</h2>
          <p>Build a journaling habit that transforms your walk with God</p>
        </div>

        <div className="challenge-nudge-tiers">
          <div className="challenge-tier">
            <span className="tier-days">7</span>
            <span className="tier-label">days</span>
          </div>
          <div className="challenge-tier recommended">
            <span className="tier-badge">Popular</span>
            <span className="tier-days">21</span>
            <span className="tier-label">days</span>
          </div>
          <div className="challenge-tier">
            <span className="tier-days">50</span>
            <span className="tier-label">days</span>
          </div>
        </div>

        <div className="challenge-nudge-actions">
          <Link href="/challenge" className="challenge-nudge-btn" onClick={dismiss}>
            Start the Challenge
          </Link>
          <button className="challenge-nudge-later" onClick={dismiss}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
