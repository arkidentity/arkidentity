'use client';

import { usePrayer } from './PrayerContext';

export function PrayerCompletion() {
  const { state, navigateTo, exitPrayer } = usePrayer();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  // Get milestone message
  const getMilestoneMessage = () => {
    const streak = state.streak.current;
    if (streak === 1) return 'Great start! Keep the momentum going.';
    if (streak === 7) return 'One week strong! You\'re building a habit.';
    if (streak === 14) return 'Two weeks! Prayer is becoming part of you.';
    if (streak === 21) return 'Three weeks! A habit is forming.';
    if (streak === 30) return 'One month! You\'re a prayer warrior.';
    if (streak % 10 === 0 && streak > 0) return `${streak} days! Incredible commitment.`;
    if (streak >= 3) return 'Keep showing up. God is listening.';
    return null;
  };

  const milestone = getMilestoneMessage();

  return (
    <div className="prayer-completion">
      {/* Celebration Icon */}
      <div className="completion-icon">✨</div>

      {/* Title */}
      <h1 className="completion-title">Well Done</h1>
      <p className="completion-time">
        You prayed for {formatDuration(state.sessionDuration)}
      </p>

      {/* Streak */}
      <div className="completion-streak">
        <span className="streak-flame">🔥</span>
        <span className="streak-text">{state.streak.current}-day streak</span>
      </div>

      {/* Milestone Message */}
      {milestone && (
        <p className="completion-milestone">{milestone}</p>
      )}

      {/* Actions */}
      <div className="completion-actions">
        <button
          className="completion-btn primary"
          onClick={() => navigateTo('dashboard')}
        >
          Back to Prayer Room
        </button>
        <button
          className="completion-btn secondary"
          onClick={exitPrayer}
        >
          Exit Prayer
        </button>
      </div>
    </div>
  );
}
