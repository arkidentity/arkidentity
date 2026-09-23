import { createSign } from 'node:crypto';

// Minimal Google Calendar client for the shared ARK Campus calendar. Auth is a
// service account (the calendar is shared with its email, "Make changes to
// events") — no OAuth, Travis's personal calendar is never touched. Node only.
//
// Env:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL   xxx@yyy.iam.gserviceaccount.com
//   GOOGLE_SERVICE_ACCOUNT_KEY     the private_key from the JSON key file
//                                  (literal "\n" sequences are fine)
//   IOWA_GOOGLE_CALENDAR_ID        ...@group.calendar.google.com
// With any of these missing, calendarConfigured() is false and every sync is a
// no-op, so the admin keeps working without Google.

const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const API = 'https://www.googleapis.com/calendar/v3';

export function calendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
    process.env.IOWA_GOOGLE_CALENDAR_ID
  );
}

function calendarId(): string {
  return encodeURIComponent(process.env.IOWA_GOOGLE_CALENDAR_ID!);
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString('base64url');

let cached: { token: string; expires: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, '\n');
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key).toString('base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`Google auth failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

async function gcal<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const res = await fetch(`${API}/calendars/${calendarId()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  // Already gone is fine for a delete; a missing event on patch means it was
  // deleted in Google — callers recreate it.
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw new Error(`Google Calendar ${init.method ?? 'GET'} ${path} failed (${res.status}): ${await res.text()}`);
  if (res.status === 204) return null;
  return (await res.json()) as T;
}

// The subset of a Google event we read or write.
export interface GEvent {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  recurrence?: string[];
  // 'opaque' = blocks the viewer's time (Google's default when unset),
  // 'transparent' = shows on the calendar without making them busy.
  transparency?: 'opaque' | 'transparent';
  recurringEventId?: string;
  originalStartTime?: { date?: string; dateTime?: string; timeZone?: string };
  extendedProperties?: { private?: Record<string, string> };
}

// Every event from `timeMin` on (recurring events come back as their master,
// not expanded), following pages. showDeleted so single weeks cancelled out of
// a series come back as status 'cancelled' exceptions — that's how a skipped
// week in Google reaches the admin.
export async function listCalendarEvents(timeMin: string): Promise<GEvent[]> {
  const out: GEvent[] = [];
  let pageToken: string | undefined;
  do {
    const qs = new URLSearchParams({ timeMin, singleEvents: 'false', maxResults: '250', showDeleted: 'true' });
    if (pageToken) qs.set('pageToken', pageToken);
    const page = await gcal<{ items?: GEvent[]; nextPageToken?: string }>(`/events?${qs}`);
    out.push(...(page?.items ?? []));
    pageToken = page?.nextPageToken;
  } while (pageToken);
  return out;
}

export async function insertCalendarEvent(event: GEvent): Promise<GEvent> {
  const created = await gcal<GEvent>('/events', { method: 'POST', body: JSON.stringify(event) });
  if (!created) throw new Error('Google Calendar insert returned nothing.');
  return created;
}

// Returns null when the event no longer exists in Google.
export async function patchCalendarEvent(id: string, event: GEvent): Promise<GEvent | null> {
  return gcal<GEvent>(`/events/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(event) });
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await gcal(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
