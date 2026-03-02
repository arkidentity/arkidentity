'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { SettingsButton } from '@/components/settings';
import { updateUserProfile } from '@/lib/auth';

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalJournalEntries: number;
}

function getStreakMessage(currentStreak: number, longestStreak: number): string {
  if (currentStreak === 0) {
    return "Start your journey today. Every day counts.";
  } else if (currentStreak === 1) {
    return "Great start! Come back tomorrow to keep growing.";
  } else if (currentStreak < 7) {
    return "You're building momentum. Keep showing up!";
  } else if (currentStreak < 21) {
    return "A week of faithfulness! You're forming a habit.";
  } else if (currentStreak < 50) {
    return "21+ days strong! This is becoming part of who you are.";
  } else if (currentStreak < 100) {
    return "Incredible consistency! Your dedication is inspiring.";
  } else if (currentStreak >= longestStreak && currentStreak > 0) {
    return "You're at your longest streak ever! Keep going!";
  } else {
    return "Your faithfulness is shaping your identity in Christ.";
  }
}

export default function ProfilePage() {
  const { user, profile, isLoggedIn, signOut, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    currentStreak: 0,
    longestStreak: 0,
    totalJournalEntries: 0,
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const entries = JSON.parse(localStorage.getItem('ark_journal_entries') || '[]');
      setStats({
        currentStreak: parseInt(localStorage.getItem('ark_current_streak') || '0'),
        longestStreak: parseInt(localStorage.getItem('ark_longest_streak') || '0'),
        totalJournalEntries: entries.length,
      });
    }
  }, []);

  useEffect(() => {
    if (profile?.display_name) {
      setNewDisplayName(profile.display_name);
    } else if (user?.email) {
      setNewDisplayName(user.email.split('@')[0]);
    }
  }, [profile, user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/journal');
  };

  const handleSaveDisplayName = async () => {
    if (!user?.id || !newDisplayName.trim() || isSavingName) return;

    setIsSavingName(true);
    try {
      const { error } = await updateUserProfile(user.id, {
        display_name: newDisplayName.trim(),
      });

      if (error) {
        console.error('[Profile] Error updating display name:', error);
        alert('Failed to update name. Please try again.');
      } else {
        setIsEditingName(false);
        window.location.reload();
      }
    } catch (err) {
      console.error('[Profile] Unexpected error:', err);
      alert('Failed to update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    if (profile?.display_name) {
      setNewDisplayName(profile.display_name);
    } else if (user?.email) {
      setNewDisplayName(user.email.split('@')[0]);
    }
    setIsEditingName(false);
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Disciple';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const streakMessage = getStreakMessage(stats.currentStreak, stats.longestStreak);

  return (
    <div className="profile-page">
      {/* Settings Button */}
      <div className="settings-btn-container">
        <SettingsButton />
      </div>

      {/* Header */}
      <header className="profile-header">
        <Link href="/journal" className="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </Link>
        <h1 className="page-title">Profile</h1>
        <div style={{ width: 80 }} />
      </header>

      <div className="profile-content">
        {/* Account Card */}
        {loading ? (
          <div className="profile-account-card">
            <div className="profile-loading">Loading...</div>
          </div>
        ) : isLoggedIn ? (
          <div className="profile-account-card">
            <div className="profile-account-info">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" />
                  ) : (
                    <span>{displayName[0].toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="profile-account-details">
                <div className="profile-account-name-row">
                  {isEditingName ? (
                    <div className="profile-edit-name-form">
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="Display name"
                        maxLength={50}
                        disabled={isSavingName}
                      />
                      <button
                        className="profile-save-name-btn"
                        onClick={handleSaveDisplayName}
                        disabled={isSavingName || !newDisplayName.trim()}
                      >
                        {isSavingName ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className="profile-cancel-name-btn"
                        onClick={handleCancelEditName}
                        disabled={isSavingName}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3>{displayName}</h3>
                      <button className="profile-edit-name-btn" onClick={() => setIsEditingName(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <p className="profile-account-email">{user?.email}</p>
              </div>
            </div>
            <div className="profile-account-actions">
              <button className="profile-action-btn profile-signout-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-account-card profile-account-guest">
            <div className="profile-account-promo">
              <h3>Sync Your Journey</h3>
              <p>Sign in to save your progress to the cloud and access it from any device.</p>
              <Link href="/login" className="profile-account-signin-btn">
                Sign In / Sign Up
              </Link>
            </div>
          </div>
        )}

        {/* Streak Hero Card */}
        <div className="profile-journey-hero">
          <div className="profile-journey-streak">
            <svg viewBox="0 0 24 24" fill="currentColor" className="flame-icon" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C10.5 5.5 8 7 8 10.5C8 13.5 9.5 15.5 12 16C9 16 7 14 7 11C5.5 12.5 5 14 5 16C5 19.866 8.134 23 12 23C15.866 23 19 19.866 19 16C19 11 15 7.5 12 2Z" />
            </svg>
            <span className="profile-journey-streak-number">{stats.currentStreak}</span>
            <span className="profile-journey-streak-label">day streak</span>
          </div>
          <p className="profile-journey-message">{streakMessage}</p>
        </div>

        {/* Activity Grid */}
        <div className="profile-activity-list">
          <Link href="/journal/archive" className="profile-activity-item">
            <div className="profile-activity-icon journal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="profile-activity-info">
              <span className="profile-activity-label">Journal Entries</span>
              <span className="profile-activity-sub">Tap to view your archive</span>
            </div>
            <span className="profile-activity-value">{stats.totalJournalEntries}</span>
          </Link>

          <Link href="/prayer" className="profile-activity-item">
            <div className="profile-activity-icon prayer-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </div>
            <div className="profile-activity-info">
              <span className="profile-activity-label">Prayer Cards</span>
              <span className="profile-activity-sub">Prayers you are standing on</span>
            </div>
            <span className="profile-activity-value">0</span>
          </Link>

          <Link href="/creed-cards" className="profile-activity-item">
            <div className="profile-activity-icon creed-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="profile-activity-info">
              <span className="profile-activity-label">Creed Cards</span>
              <span className="profile-activity-sub">Identity truths memorized</span>
            </div>
            <span className="profile-activity-value">0<span className="profile-activity-total">/50</span></span>
          </Link>

          <Link href="/challenge" className="profile-activity-item">
            <div className="profile-activity-icon tools-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="profile-activity-info">
              <span className="profile-activity-label">3D Challenge</span>
              <span className="profile-activity-sub">Streak tiers &amp; badges</span>
            </div>
            <span className="profile-activity-value">{stats.currentStreak}d</span>
          </Link>
        </div>

        {/* Support Card */}
        <Link href="/giving" className="profile-support-card">
          <div className="profile-support-content">
            <div className="profile-support-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z" />
              </svg>
            </div>
            <div>
              <h4>Support the Mission</h4>
              <p>Partner with ARK Identity</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-support-arrow">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* App Info Footer */}
        <div className="profile-app-info">
          <h3>ARK Identity</h3>
          <p>Discover who you are in Christ</p>
          <p className="profile-app-mission">Moving believers from consumer Christianity to spiritual ownership by teaching them who they are in Christ.</p>
          <Link href="/giving" className="profile-give-link">Support the Mission</Link>
          <div className="profile-legal-links">
            <Link href="/privacy">Privacy Policy</Link>
            <span className="profile-legal-divider">|</span>
            <Link href="/terms">Terms of Service</Link>
          </div>
          <p className="profile-app-version">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
