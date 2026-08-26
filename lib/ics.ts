// Calendar helpers for ARK Iowa Bible studies. A study is a weekly recurring
// event at a fixed local (America/Chicago) wall-clock time.

const TZ = 'America/Chicago';

// Today's date in Chicago, as {y, m, d} (m is 1-12).
function chicagoToday(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value, 10);
  return { y: get('year'), m: get('month'), d: get('day') };
}

// The next calendar date (>= today, Chicago) that falls on `dayOfWeek` (0=Sun).
// Returned as 'YYYYMMDD'.
export function nextOccurrenceDate(dayOfWeek: number): string {
  const { y, m, d } = chicagoToday();
  const base = new Date(Date.UTC(y, m - 1, d));
  const delta = (dayOfWeek - base.getUTCDay() + 7) % 7;
  base.setUTCDate(base.getUTCDate() + delta);
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(base.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

// 'HH:MM' or 'HH:MM:SS' -> { start: 'HHMMSS', end: 'HHMMSS' } one hour later.
function timeRange(startTime: string): { start: string; end: string } {
  const [h, mnt] = startTime.split(':').map((n) => parseInt(n, 10));
  const start = `${String(h).padStart(2, '0')}${String(mnt).padStart(2, '0')}00`;
  const end = `${String((h + 1) % 24).padStart(2, '0')}${String(mnt).padStart(2, '0')}00`;
  return { start, end };
}

export interface StudyEvent {
  id: string;
  dayOfWeek: number;
  startTime: string;
  location: string | null;
}

const DESCRIPTION = 'One hour a week with ARK Iowa. Questions: travis@arkidentity.com';

export function studyIcs(event: StudyEvent): string {
  const date = nextOccurrenceDate(event.dayOfWeek);
  const { start, end } = timeRange(event.startTime);
  const stamp =
    new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ARK Iowa//Bible Study//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:study-${event.id}@arkidentity.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${TZ}:${date}T${start}`,
    `DTEND;TZID=${TZ}:${date}T${end}`,
    'RRULE:FREQ=WEEKLY',
    'SUMMARY:ARK Iowa Bible Study',
    event.location ? `LOCATION:${icsEscape(event.location)}` : '',
    `DESCRIPTION:${icsEscape(DESCRIPTION)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n') + '\r\n';
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// A "add to Google Calendar" template URL for the same recurring event.
export function googleCalendarUrl(event: StudyEvent): string {
  const date = nextOccurrenceDate(event.dayOfWeek);
  const { start, end } = timeRange(event.startTime);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'ARK Iowa Bible Study',
    dates: `${date}T${start}/${date}T${end}`,
    ctz: TZ,
    recur: 'RRULE:FREQ=WEEKLY',
    details: DESCRIPTION,
  });
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
