/**
 * Push notification utilities for Daily DNA PWA.
 *
 * Handles browser permission, push subscription, and Supabase sync.
 */

import { supabase } from './supabase';

/** Check if this browser supports push notifications */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/** Current permission state: 'default' | 'granted' | 'denied' */
export function getPermissionState(): NotificationPermission | null {
  if (!isNotificationSupported()) return null;
  return Notification.permission;
}

/** Convert VAPID public key from base64url to Uint8Array (applicationServerKey) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type SubscribeResult =
  | { ok: true; subscription: PushSubscription }
  | { ok: false; error: string };

/**
 * Subscribe to push notifications.
 * 1. Requests notification permission
 * 2. Subscribes via PushManager
 * 3. Sends subscription to our API to save in Supabase
 */
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!isNotificationSupported()) {
    return { ok: false, error: 'Push not supported in this browser' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, error: `Permission ${permission}` };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!vapidPublicKey) {
    return { ok: false, error: 'VAPID key not configured' };
  }

  try {
    // Get or register the service worker — iPad PWAs sometimes need explicit registration
    let registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) {
      // No registration found — register sw.js explicitly
      console.log('[Notifications] No SW registration found, registering /sw.js');
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }

    // Wait for the SW to be active (it may be installing/waiting)
    if (!registration.active) {
      const sw = registration.installing || registration.waiting;
      if (sw) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Service worker stuck installing. Close and reopen the app, then try again.')), 15000);
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated' || sw.state === 'redundant') {
              clearTimeout(timeout);
              if (sw.state === 'activated') resolve();
              else reject(new Error('Service worker failed to activate'));
            }
          });
        });
        // Re-fetch registration after activation
        registration = (await navigator.serviceWorker.getRegistration('/'))!;
      } else {
        return { ok: false, error: 'Service worker has no active, installing, or waiting worker' };
      }
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applicationServerKey: applicationServerKey as any,
    });

    // Get the user's auth token for the API call
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { ok: false, error: 'No active session — sign in first' };
    }

    // Save subscription to Supabase via API route
    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        device_name: getDeviceName(),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Notifications] Failed to save subscription:', text);
      return { ok: false, error: `Save failed: ${res.status} ${text.slice(0, 80)}` };
    }

    return { ok: true, subscription };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Notifications] Subscribe failed:', err);
    return { ok: false, error: msg };
  }
}

/**
 * Unsubscribe from push notifications.
 * Removes from PushManager and marks inactive in Supabase.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration?.active) return true;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true; // Already unsubscribed

    const { data: { session } } = await supabase.auth.getSession();

    // Tell our API to deactivate this subscription
    if (session) {
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }

    // Unsubscribe from the push manager
    await subscription.unsubscribe();
    return true;
  } catch (err) {
    console.error('[Notifications] Unsubscribe failed:', err);
    return false;
  }
}

/** Check if the user currently has an active push subscription */
export async function hasActiveSubscription(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration?.active) return false;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/** Send a test notification to the current user */
export async function sendTestNotification(): Promise<{ sent: number; failed: number } | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!res.ok) {
      console.error('[Notifications] Test send failed:', await res.text());
      return null;
    }

    return res.json();
  } catch (err) {
    console.error('[Notifications] Test send error:', err);
    return null;
  }
}

// ============================================
// Notification Preferences
// ============================================

export interface NotificationPrefs {
  daily_reminder_enabled: boolean;
  daily_reminder_time: string; // "HH:MM"
  message_alerts: boolean;
  event_reminders: boolean;
  streak_alerts: boolean;
  encouragement_alerts: boolean;
  challenge_reminders: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  daily_reminder_enabled: true,
  daily_reminder_time: '08:00',
  message_alerts: true,
  event_reminders: true,
  streak_alerts: true,
  encouragement_alerts: true,
  challenge_reminders: true,
};

/** Load notification preferences from Supabase. Returns defaults if no row exists. */
export async function loadNotificationPrefs(accountId: string): Promise<NotificationPrefs> {
  const { data, error } = await supabase
    .from('disciple_notification_prefs')
    .select('daily_reminder_enabled, daily_reminder_time, message_alerts, event_reminders, streak_alerts, encouragement_alerts, challenge_reminders')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_PREFS };

  return {
    daily_reminder_enabled: data.daily_reminder_enabled ?? DEFAULT_PREFS.daily_reminder_enabled,
    daily_reminder_time: data.daily_reminder_time ?? DEFAULT_PREFS.daily_reminder_time,
    message_alerts: data.message_alerts ?? DEFAULT_PREFS.message_alerts,
    event_reminders: data.event_reminders ?? DEFAULT_PREFS.event_reminders,
    streak_alerts: data.streak_alerts ?? DEFAULT_PREFS.streak_alerts,
    encouragement_alerts: data.encouragement_alerts ?? DEFAULT_PREFS.encouragement_alerts,
    challenge_reminders: data.challenge_reminders ?? DEFAULT_PREFS.challenge_reminders,
  };
}

/** Save notification preferences to Supabase (upsert). Fire-and-forget safe. */
export async function saveNotificationPrefs(
  accountId: string,
  prefs: Partial<NotificationPrefs>
): Promise<void> {
  const { error } = await supabase
    .from('disciple_notification_prefs')
    .upsert(
      { account_id: accountId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: 'account_id' }
    );

  if (error) {
    console.error('[Notifications] Save prefs error:', error);
  }
}

/** Simple device name from user agent */
function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  return 'Unknown';
}
