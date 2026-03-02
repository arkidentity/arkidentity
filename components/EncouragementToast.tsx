'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const ENCOURAGEMENT_MESSAGES = [
  { title: 'Keep Going!', message: "Don't give up! You're building something beautiful." },
  { title: 'Stay Faithful!', message: 'God is waiting to meet with you in His Word.' },
  { title: 'Momentum!', message: "You're building something beautiful. Keep showing up." },
  { title: 'Small Steps!', message: 'Small steps lead to big transformation.' },
  { title: 'Every Day Counts!', message: 'Consistency is key. You\'ve got this!' },
  { title: 'Well Done!', message: 'The Word is taking root in your heart.' },
  { title: 'Keep Showing Up!', message: 'God honors faithfulness.' },
];

const STREAK_MILESTONES: Record<number, string> = {
  3: "You're getting started!",
  7: 'One week strong!',
  14: 'Two weeks of faithfulness!',
  21: "You're forming a habit!",
  30: 'A whole month!',
  50: '50 days of dedication!',
  100: 'Triple digits! Incredible!',
  365: 'ONE YEAR!',
};

const HIDDEN_PATHS = ['/about', '/team', '/beliefs', '/giving', '/get-involved', '/vision-2026', '/iowa', '/login', '/reset-password', '/auth'];

export function EncouragementToast() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; emoji: string } | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setToast(null), 300);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (HIDDEN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return;

    // Only show once per day
    const today = new Date().toDateString();
    if (localStorage.getItem('ark_encouragement_shown') === today) return;

    const timer = setTimeout(() => {
      localStorage.setItem('ark_encouragement_shown', today);

      const streak = parseInt(localStorage.getItem('ark_current_streak') || '0');
      let title: string;
      let message: string;
      let emoji = '✨';

      // Check for streak milestone
      const milestoneMsg = STREAK_MILESTONES[streak];
      if (milestoneMsg) {
        title = `${streak}-Day Streak!`;
        message = milestoneMsg;
        emoji = '🔥';
      } else {
        const random = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
        title = random.title;
        message = random.message;
      }

      setToast({ title, message, emoji });
      setTimeout(() => setVisible(true), 50);

      // Auto-dismiss after 5 seconds
      setTimeout(() => dismiss(), 5000);
    }, 60000); // 60 seconds after load

    return () => clearTimeout(timer);
  }, [pathname, dismiss]);

  if (!toast) return null;

  return (
    <div
      className={`encouragement-toast ${visible ? 'show' : ''}`}
      onClick={dismiss}
      role="button"
      tabIndex={0}
    >
      <span className="encouragement-emoji">{toast.emoji}</span>
      <div className="encouragement-content">
        <strong className="encouragement-title">{toast.title}</strong>
        <p className="encouragement-message">{toast.message}</p>
      </div>
      <button className="encouragement-close" onClick={dismiss} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
