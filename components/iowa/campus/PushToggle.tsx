'use client';

import { useEffect, useState } from 'react';
import { Section } from '@/components/iowa/campus/ui';

// Turning on push for THIS device (migration 027). Each phone or laptop
// subscribes separately — that's how web push works, not a per-person setting.
//
// On iPhone this only works inside the installed admin app: Safari itself never
// offers it, so the card says so rather than failing silently.

type State = 'loading' | 'unsupported' | 'ios-needs-install' | 'blocked' | 'off' | 'on';

// The VAPID public key travels as base64url; the browser wants raw bytes.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const SW_URL = '/iowa/admin/sw.js';
const SW_SCOPE = '/iowa/admin/';
const OLD_SW_URL = '/iowa-sw.js'; // pre-2026-09-23, at the root — outside scope

// Anyone who subscribed before the move is on the root worker. Drop that
// subscription and its worker so the next subscribe lands in the app's scope.
async function clearOldWorker(): Promise<boolean> {
  const old = await navigator.serviceWorker.getRegistration(OLD_SW_URL).catch(() => null);
  if (!old || !old.active?.scriptURL.endsWith(OLD_SW_URL)) return false;
  const sub = await old.pushManager.getSubscription().catch(() => null);
  if (sub) {
    await fetch('/api/iowa/admin/push', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
  await old.unregister().catch(() => {});
  return true;
}

// Nothing here should be able to hang the card: a worker that never activates
// (offline, a proxy swallowing the script) would otherwise spin forever.
function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T | null> {
  return Promise.race([p.catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), ms))]);
}

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

export default function PushToggle({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        // An iPhone only exposes PushManager inside an installed app.
        if (!cancelled) setState(isIOS() && !isStandalone() ? 'ios-needs-install' : 'unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        if (!cancelled) setState('blocked');
        return;
      }
      try {
        const hadOld = await clearOldWorker();
        const reg = await withTimeout(navigator.serviceWorker.getRegistration(SW_URL));
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (cancelled) return;
        setState(sub ? 'on' : 'off');
        if (hadOld && !sub) setNote('Notifications moved to the app itself — turn them on again here.');
      } catch {
        if (!cancelled) setState('off');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    setBusy(true);
    setError('');
    setNote('');
    try {
      if (!vapidPublicKey) throw new Error('Push isn’t set up on the server yet (VAPID keys).');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return;
      }
      await clearOldWorker();
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
      await withTimeout(navigator.serviceWorker.ready);
      if (!reg.active && !reg.installing && !reg.waiting) {
        throw new Error('The notification worker didn’t start. Reload and try again.');
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        }));
      const res = await fetch('/api/iowa/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save this device.');
      setState('on');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const reg = await withTimeout(navigator.serviceWorker.getRegistration(SW_URL));
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch('/api/iowa/admin/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState('off');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setError('');
    setNote('');
    const res = await fetch('/api/iowa/admin/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || 'Could not send it.');
    else setNote(json.sent ? `Sent to ${json.sent} device${json.sent === 1 ? '' : 's'}.` : 'No devices are subscribed yet.');
  }

  const btn = 'px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50';

  return (
    <Section title="Notifications on this device">
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-[#4a4540] space-y-3">
        {state === 'loading' && <p className="text-[#8a8378]">Checking…</p>}

        {state === 'ios-needs-install' && (
          <p>
            On an iPhone, notifications only work from the installed app. Add ARK Iowa to your home screen
            (Share → Add to Home Screen), open it from there, and this will switch on.
          </p>
        )}

        {state === 'unsupported' && <p>This browser can’t do notifications. Try Chrome, or the installed app.</p>}

        {state === 'blocked' && (
          <p>
            Notifications are blocked for this site. Turn them back on in your browser or phone settings, then
            reload this page.
          </p>
        )}

        {state === 'off' && (
          <>
            <p>Get a notification when someone gives you a task, offers to help, or writes a note on one of yours.</p>
            <button onClick={turnOn} disabled={busy} className={btn} style={{ backgroundColor: 'var(--navy)', color: 'white' }}>
              Turn on notifications
            </button>
          </>
        )}

        {state === 'on' && (
          <>
            <p>
              <span className="font-semibold text-green-700">On for this device.</span> Your 6 PM email still comes
              as the day&apos;s recap — change that on the Staff page.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={test} disabled={busy} className={`${btn} border`} style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
                Send a test
              </button>
              <button onClick={turnOff} disabled={busy} className={`${btn} border`} style={{ borderColor: '#d1d5db', color: '#b91c1c' }}>
                Turn off here
              </button>
            </div>
          </>
        )}

        {note && <p className="text-xs font-semibold text-green-700">{note}</p>}
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    </Section>
  );
}
