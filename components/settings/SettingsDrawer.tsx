'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { updateUserProfile } from '@/lib/auth';
import {
  isNotificationSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  hasActiveSubscription,
  sendTestNotification,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '@/lib/notifications';

interface OnboardingStatus {
  signin: boolean;
  install: boolean;
  journal: boolean;
  prayer: boolean;
  creed: boolean;
  complete: boolean;
}

interface ProfileStats {
  currentStreak: number;
  longestStreak: number;
  journalEntries: number;
  prayerCards: number;
}

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function getStreakMessage(current: number, longest: number): string {
  if (current === 0) return 'Start your journey today. Every day counts.';
  if (current === 1) return 'Great start! Come back tomorrow to keep growing.';
  if (current < 7) return "You're building momentum. Keep showing up!";
  if (current < 21) return "A week of faithfulness! You're forming a habit.";
  if (current >= longest && current > 0) return "You're at your longest streak ever! Keep going!";
  return 'Your faithfulness is shaping your identity in Christ.';
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { signOut, isLoggedIn, user, profile, loading } = useAuth();

  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
    signin: false, install: false, journal: false, prayer: false, creed: false, complete: false,
  });
  const [checklistCollapsed, setChecklistCollapsed] = useState(false);
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    currentStreak: 0, longestStreak: 0, journalEntries: 0, prayerCards: 0,
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Notification state
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
  const [notifSubscribed, setNotifSubscribed] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs | null>(null);
  const [iosNeedsPWA, setIosNeedsPWA] = useState(false);

  // Read localStorage on mount and whenever login state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent;
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(ua));
    setIsIOS(/iPhone|iPad|iPod/i.test(ua));
    const pwa =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsPWA(pwa);

    // Read stats
    const journalRaw = localStorage.getItem('ark_journal_entries');
    const journalEntries = journalRaw ? (JSON.parse(journalRaw) as unknown[]).length : 0;
    const prayerRaw = localStorage.getItem('dna_prayer_cards');
    const prayerCards = prayerRaw ? (JSON.parse(prayerRaw) as unknown[]).filter((c: unknown) => {
      const card = c as { deletedAt?: unknown };
      return !card.deletedAt;
    }).length : 0;
    setStats({
      currentStreak: parseInt(localStorage.getItem('ark_current_streak') || '0'),
      longestStreak: parseInt(localStorage.getItem('ark_longest_streak') || '0'),
      journalEntries,
      prayerCards,
    });

    // Auto-sync onboarding from actual data
    const journalDone = journalEntries > 0;
    const prayerDone = prayerCards > 0;
    const creedDone = localStorage.getItem('ark_onboarding_creed') === 'true';
    const signinDone = localStorage.getItem('ark_onboarding_signin') === 'true' || isLoggedIn;
    const installDone = localStorage.getItem('ark_onboarding_install') === 'true';

    if (journalDone) localStorage.setItem('ark_onboarding_journal', 'true');
    if (prayerDone) localStorage.setItem('ark_onboarding_prayer', 'true');
    if (signinDone) localStorage.setItem('ark_onboarding_signin', 'true');

    const allDone = signinDone && journalDone && prayerDone && creedDone && (!isMobile || isPWA || installDone);
    if (allDone) localStorage.setItem('ark_onboarding_complete', 'true');

    setOnboardingStatus({
      signin: signinDone,
      install: installDone,
      journal: journalDone,
      prayer: prayerDone,
      creed: creedDone,
      complete: allDone || localStorage.getItem('ark_onboarding_complete') === 'true',
    });
  }, [isLoggedIn, isMobile, isPWA]);

  // Refresh stats when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    const supported = isNotificationSupported();
    setNotifSupported(supported);
    setNotifPermission(getPermissionState());
    if (supported && Notification.permission === 'granted') {
      // Check if there's already an active push subscription
      hasActiveSubscription().then(async (active) => {
        if (active) {
          setNotifSubscribed(true);
        } else {
          // Permission was granted but subscription was never completed
          // (e.g., page reloaded during the permission prompt on mobile).
          // Auto-complete the subscription silently.
          const result = await subscribeToPush();
          if (result.ok) {
            setNotifSubscribed(true);
            setNotifPermission('granted');
          }
        }
      });
    }
    const ua = navigator.userAgent;
    const isApple = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIosNeedsPWA(isApple && !standalone);
    if (user?.id) loadNotificationPrefs(user.id).then(setNotifPrefs);
  }, [isOpen, user?.id]);

  // Sync display name from profile
  useEffect(() => {
    if (profile?.display_name) setNewDisplayName(profile.display_name);
    else if (user?.email) setNewDisplayName(user.email.split('@')[0]);
  }, [profile, user]);

  const handleNotifToggle = useCallback(async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    setTestResult(null);
    setNotifError(null);
    try {
      if (notifSubscribed) {
        await unsubscribeFromPush();
        setNotifSubscribed(false);
      } else {
        const result = await subscribeToPush();
        if (result.ok) {
          setNotifSubscribed(true);
          setNotifPermission('granted');
        } else {
          setNotifPermission(getPermissionState());
          setNotifError(result.error);
        }
      }
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : String(err));
    } finally {
      setNotifLoading(false);
    }
  }, [notifLoading, notifSubscribed]);

  const handleTestNotification = useCallback(async () => {
    if (testSending) return;
    setTestSending(true);
    setTestResult(null);
    const result = await sendTestNotification();
    setTestResult(result ? `Sent to ${result.sent} device${result.sent !== 1 ? 's' : ''}` : 'Failed to send');
    setTestSending(false);
  }, [testSending]);

  const handlePrefToggle = useCallback((key: keyof NotificationPrefs) => {
    if (!notifPrefs || !user?.id) return;
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    void saveNotificationPrefs(user.id, { [key]: updated[key] });
  }, [notifPrefs, user?.id]);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ARK Identity', text: 'Check out ARK Identity - discover who you are in Christ', url: 'https://arkidentity.com' });
      } catch { /* cancelled */ }
    }
    onClose();
  };

  const handleSaveDisplayName = async () => {
    if (!user?.id || !newDisplayName.trim() || isSavingName) return;
    setIsSavingName(true);
    try {
      await updateUserProfile(user.id, { display_name: newDisplayName.trim() });
      setIsEditingName(false);
    } catch {
      // silent fail
    } finally {
      setIsSavingName(false);
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Disciple';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const streakMessage = getStreakMessage(stats.currentStreak, stats.longestStreak);
  const showOnboardingChecklist = !onboardingStatus.complete;

  return (
    <>
      {/* Backdrop */}
      <div className={`settings-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />

      {/* Drawer */}
      <div className={`settings-drawer ${isOpen ? 'show' : ''}`}>
        <div className="settings-drawer-header">
          <h2>Account</h2>
          <button className="settings-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="settings-menu-items">

          {/* ── USER CARD ── */}
          {loading ? (
            <div className="profile-drawer-user-card">
              <div className="profile-drawer-loading">Loading…</div>
            </div>
          ) : isLoggedIn ? (
            <div className="profile-drawer-user-card">
              <div className="profile-drawer-avatar">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" />
                  : <span>{displayName[0].toUpperCase()}</span>
                }
              </div>
              <div className="profile-drawer-user-info">
                {isEditingName ? (
                  <div className="profile-drawer-edit-row">
                    <input
                      className="profile-drawer-name-input"
                      type="text"
                      value={newDisplayName}
                      onChange={e => setNewDisplayName(e.target.value)}
                      maxLength={50}
                      disabled={isSavingName}
                      autoFocus
                    />
                    <button className="profile-drawer-name-save" onClick={handleSaveDisplayName} disabled={isSavingName || !newDisplayName.trim()}>
                      {isSavingName ? '…' : 'Save'}
                    </button>
                    <button className="profile-drawer-name-cancel" onClick={() => setIsEditingName(false)}>✕</button>
                  </div>
                ) : (
                  <div className="profile-drawer-name-row">
                    <span className="profile-drawer-name">{displayName}</span>
                    <button className="profile-drawer-edit-btn" onClick={() => setIsEditingName(true)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                  </div>
                )}
                <span className="profile-drawer-email">{user?.email}</span>
              </div>
            </div>
          ) : (
            <div className="profile-drawer-guest-card">
              <h3>Sync Your Journey</h3>
              <p>Sign in to save your progress and access it from any device.</p>
              <Link href="/login" className="profile-drawer-signin-btn" onClick={onClose}>Sign In / Sign Up</Link>
            </div>
          )}

          {/* ── STREAK ── */}
          <div className="profile-drawer-streak-card">
            <div className="profile-drawer-streak-left">
              <svg viewBox="0 0 24 24" fill="currentColor" className="profile-drawer-flame">
                <path d="M12 2C10.5 5.5 8 7 8 10.5C8 13.5 9.5 15.5 12 16C9 16 7 14 7 11C5.5 12.5 5 14 5 16C5 19.866 8.134 23 12 23C15.866 23 19 19.866 19 16C19 11 15 7.5 12 2Z" />
              </svg>
              <div>
                <span className="profile-drawer-streak-num">{stats.currentStreak}</span>
                <span className="profile-drawer-streak-label">day streak</span>
              </div>
            </div>
            <p className="profile-drawer-streak-msg">{streakMessage}</p>
          </div>

          {/* ── ACTIVITY ── */}
          <div className="profile-drawer-activity-list">
            <Link href="/journal/archive" className="profile-drawer-activity-item" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="profile-drawer-activity-label">Journal Entries</span>
              <span className="profile-drawer-activity-value">{stats.journalEntries}</span>
            </Link>
            <Link href="/prayer" className="profile-drawer-activity-item" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M11 21H8.5C7.7 21 7 20.6 6.6 19.9L4.1 15.4C3.7 14.7 3.7 13.8 4 13.1L7.5 6C7.9 5.1 9 4.7 9.9 5.1 10.6 5.4 11 6.1 11 6.9V21Z" />
                <path d="M13 21H15.5C16.3 21 17 20.6 17.4 19.9L19.9 15.4C20.3 14.7 20.3 13.8 20 13.1L16.5 6C16.1 5.1 15 4.7 14.1 5.1 13.4 5.4 13 6.1 13 6.9V21Z" />
              </svg>
              <span className="profile-drawer-activity-label">Prayer Cards</span>
              <span className="profile-drawer-activity-value">{stats.prayerCards}</span>
            </Link>
            <Link href="/creed-cards" className="profile-drawer-activity-item" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
              <span className="profile-drawer-activity-label">Creed Cards</span>
              <span className="profile-drawer-activity-value"><span style={{ opacity: 0.6 }}>—</span></span>
            </Link>
            <Link href="/challenge" className="profile-drawer-activity-item" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="profile-drawer-activity-label">3D Challenge</span>
              <span className="profile-drawer-activity-value">{stats.currentStreak}d</span>
            </Link>
          </div>

          {/* ── SUPPORT ── */}
          <Link href="/giving" className="profile-drawer-support" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z" />
            </svg>
            <span>Support the Mission</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-drawer-support-chevron">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          <div className="settings-divider" />

          {/* ── NOTIFICATIONS ── */}
          {isLoggedIn && notifSupported && (
            <div className="settings-notif-section">
              <button className="settings-menu-item" onClick={notifPermission === 'denied' ? undefined : handleNotifToggle} disabled={notifPermission === 'denied' || notifLoading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Notifications</span>
                <span className={`settings-toggle ${notifSubscribed ? 'on' : ''} ${notifPermission === 'denied' ? 'disabled' : ''}`} aria-label={notifSubscribed ? 'Notifications on' : 'Notifications off'}>
                  <span className="settings-toggle-knob" />
                </span>
              </button>
              {notifPermission === 'denied' && <span className="settings-notif-hint">Blocked in browser settings</span>}
              {iosNeedsPWA && !notifSubscribed && <span className="settings-notif-hint settings-notif-warn">Add this app to your Home Screen first, then enable notifications here.</span>}
              {notifError && <span className="settings-notif-hint settings-notif-warn">{notifError}</span>}
              {testResult && <span className="settings-notif-hint">{testResult}</span>}

              {notifSubscribed && notifPrefs && (
                <button className="settings-notif-expand-row" onClick={() => setShowNotifPrefs(v => !v)}>
                  <span>Preferences</span>
                  <svg
                    className={`onboarding-chevron ${showNotifPrefs ? '' : 'collapsed'}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
              )}

              {showNotifPrefs && notifSubscribed && notifPrefs && (
                <div className="settings-notif-prefs">
                  {([
                    ['message_alerts', 'Group Messages'],
                    ['event_reminders', 'Event Reminders'],
                    ['daily_reminder_enabled', 'Daily Reminder'],
                    ['streak_alerts', 'Streak Alerts'],
                    ['encouragement_alerts', 'Encouragement'],
                    ['challenge_reminders', 'Challenge Reminders'],
                  ] as [keyof NotificationPrefs, string][]).map(([key, label]) => (
                    <div key={key}>
                      <button className="settings-notif-pref-row" onClick={() => handlePrefToggle(key)}>
                        <span className="settings-notif-pref-label">{label}</span>
                        <span className={`settings-toggle-sm ${notifPrefs[key] ? 'on' : ''}`}><span className="settings-toggle-knob-sm" /></span>
                      </button>
                      {key === 'daily_reminder_enabled' && notifPrefs.daily_reminder_enabled && (
                        <div className="settings-notif-time-row">
                          <span className="settings-notif-pref-label">Reminder Time</span>
                          <input type="time" className="settings-notif-time-input" value={notifPrefs.daily_reminder_time}
                            onChange={e => {
                              const val = e.target.value;
                              if (!val || !user?.id) return;
                              const updated = { ...notifPrefs, daily_reminder_time: val };
                              setNotifPrefs(updated);
                              void saveNotificationPrefs(user.id, { daily_reminder_time: val });
                            }} />
                        </div>
                      )}
                    </div>
                  ))}
                  <button className="settings-test-btn" onClick={handleTestNotification} disabled={testSending}>
                    {testSending ? 'Sending…' : 'Send Test Notification'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── SHARE ── */}
          <button className="settings-menu-item" onClick={handleShare}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98" /><path d="M15.41 6.51l-6.82 3.98" />
            </svg>
            <span>Share App</span>
          </button>

          <div className="settings-divider" />

          {/* ── SIGN OUT / IN ── */}
          {isLoggedIn ? (
            <button className="settings-menu-item sign-out" onClick={handleSignOut}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          ) : (
            <Link href="/login" className="settings-menu-item sign-in" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Sign In</span>
            </Link>
          )}

          {/* ── GETTING STARTED ── */}
          {showOnboardingChecklist && (
            <>
              <div className="settings-divider" />
              <div className="onboarding-checklist">
                <button className="onboarding-header-row" onClick={() => setChecklistCollapsed(c => !c)}>
                  <span className="onboarding-header">Getting Started</span>
                  <svg
                    className={`onboarding-chevron ${checklistCollapsed ? 'collapsed' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>

                {!checklistCollapsed && (
                  <div className="onboarding-items">
                    {/* Sign In */}
                    <Link
                      href={onboardingStatus.signin ? '#' : '/login'}
                      className={`onboarding-item ${onboardingStatus.signin ? 'completed' : 'highlighted'}`}
                      onClick={onboardingStatus.signin ? undefined : onClose}
                    >
                      {onboardingStatus.signin
                        ? <span className="onboarding-checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg></span>
                        : <span className="onboarding-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7l7 7-7 7" /></svg></span>
                      }
                      <span className="onboarding-number">{onboardingStatus.signin ? '✓' : '1'}</span>
                      <div className="onboarding-text">
                        <span className="onboarding-label">Save your progress</span>
                        <span className="onboarding-action">{onboardingStatus.signin ? 'Signed In' : 'Sign In'}</span>
                      </div>
                    </Link>

                    {/* Install App (mobile only) */}
                    {isMobile && !isPWA && (
                      <button
                        className={`onboarding-item ${onboardingStatus.install ? 'completed' : 'highlighted'}`}
                        onClick={() => setShowInstallModal(true)}
                      >
                        {onboardingStatus.install
                          ? <span className="onboarding-checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg></span>
                          : <span className="onboarding-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7l7 7-7 7" /></svg></span>
                        }
                        <span className="onboarding-number">{onboardingStatus.install ? '✓' : '2'}</span>
                        <div className="onboarding-text">
                          <span className="onboarding-label">Get the app</span>
                          <span className="onboarding-action">{onboardingStatus.install ? 'Installed' : 'Install App'}</span>
                        </div>
                      </button>
                    )}

                    {/* First Journal */}
                    <Link href="/journal" className={`onboarding-item ${onboardingStatus.journal ? 'completed' : 'highlighted'}`} onClick={onClose} style={{ cursor: 'pointer' }}>
                      {onboardingStatus.journal
                        ? <span className="onboarding-checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg></span>
                        : <span className="onboarding-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7l7 7-7 7" /></svg></span>
                      }
                      <span className="onboarding-number">{onboardingStatus.journal ? '✓' : '3'}</span>
                      <div className="onboarding-text">
                        <span className="onboarding-label">Write in your journal</span>
                        <span className="onboarding-action">{onboardingStatus.journal ? 'Journal Created' : 'First Journal'}</span>
                      </div>
                    </Link>

                    {/* First Prayer Card */}
                    <Link href="/prayer" className={`onboarding-item ${onboardingStatus.prayer ? 'completed' : 'highlighted'}`} onClick={onClose} style={{ cursor: 'pointer' }}>
                      {onboardingStatus.prayer
                        ? <span className="onboarding-checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg></span>
                        : <span className="onboarding-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7l7 7-7 7" /></svg></span>
                      }
                      <span className="onboarding-number">{onboardingStatus.prayer ? '✓' : '4'}</span>
                      <div className="onboarding-text">
                        <span className="onboarding-label">Add a prayer</span>
                        <span className="onboarding-action">{onboardingStatus.prayer ? 'Prayer Card Added' : 'First Prayer Card'}</span>
                      </div>
                    </Link>

                    {/* Creed Cards */}
                    <Link href="/creed-cards" className={`onboarding-item ${onboardingStatus.creed ? 'completed' : 'highlighted'}`} onClick={onClose} style={{ cursor: 'pointer' }}>
                      {onboardingStatus.creed
                        ? <span className="onboarding-checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg></span>
                        : <span className="onboarding-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7l7 7-7 7" /></svg></span>
                      }
                      <span className="onboarding-number">{onboardingStatus.creed ? '✓' : '5'}</span>
                      <div className="onboarding-text">
                        <span className="onboarding-label">Explore your identity</span>
                        <span className="onboarding-action">{onboardingStatus.creed ? 'Creed Cards Explored' : 'Check out Creed Cards'}</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── APP FOOTER ── */}
          <div className="profile-drawer-footer">
            <p className="profile-drawer-footer-title">ARK Identity</p>
            <p className="profile-drawer-footer-sub">Discover who you are in Christ</p>
            <div className="profile-drawer-footer-links">
              <Link href="/privacy" onClick={onClose}>Privacy</Link>
              <span>·</span>
              <Link href="/terms" onClick={onClose}>Terms</Link>
            </div>
          </div>

        </div>{/* end settings-menu-items */}
      </div>

      {/* Install App Modal */}
      {showInstallModal && (
        <div className="install-modal-overlay" onClick={() => setShowInstallModal(false)}>
          <div className="install-modal" onClick={e => e.stopPropagation()}>
            <div className="install-modal-header">
              <div>
                <h3>Install Instructions</h3>
                <p className="install-modal-subline">Add to home screen for full app experience</p>
              </div>
              <button className="install-modal-close" onClick={() => setShowInstallModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {isIOS ? (
              <div className="install-modal-steps">
                <p className="install-modal-intro" style={{ display: 'none' }} />
                <div className="install-step"><span className="install-step-num">1</span><div><strong>Tap the Share button</strong><p>The box with an arrow pointing up at the bottom of Safari</p></div></div>
                <div className="install-step"><span className="install-step-num">2</span><div><strong>Tap &ldquo;Add to Home Screen&rdquo;</strong><p>Scroll down in the share sheet to find this option</p></div></div>
                <div className="install-step"><span className="install-step-num">3</span><div><strong>Tap &ldquo;Add&rdquo;</strong><p>ARK Identity will appear on your home screen like any app</p></div></div>
              </div>
            ) : (
              <div className="install-modal-steps">
                <p className="install-modal-intro" style={{ display: 'none' }} />
                <div className="install-step"><span className="install-step-num">1</span><div><strong>Tap the menu button</strong><p>Tap the three dots (⋮) in the top right of Chrome</p></div></div>
                <div className="install-step"><span className="install-step-num">2</span><div><strong>Tap &ldquo;Add to Home screen&rdquo;</strong><p>Or look for &ldquo;Install app&rdquo; in the menu</p></div></div>
                <div className="install-step"><span className="install-step-num">3</span><div><strong>Tap &ldquo;Add&rdquo;</strong><p>ARK Identity will appear on your home screen like any app</p></div></div>
              </div>
            )}
            <button className="install-modal-done" onClick={() => {
              localStorage.setItem('ark_onboarding_install', 'true');
              setShowInstallModal(false);
            }}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
