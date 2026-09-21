import { randomBytes } from 'node:crypto';
import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { listStaff, getStaff, type IowaStaff } from '@/lib/iowaStaff';
import { findOrCreateContact, createContact, ensureTag } from '@/lib/contacts';
import { formatTime } from '@/lib/bibleStudyFormat';
import { addDays, chicagoToday, eventDatesInRange, formatDate, isValidDate } from '@/lib/campusFormat';
import { sendEventInvite, sendInviteAnswer, sendPersonalRsvp, siteUrl } from '@/lib/email';

// Staff invites + RSVPs (migration 020). See docs/IOWA-CAMPUS-TASKS.md →
// "Invites and RSVPs".
//   Staff: being put on an event is an invite (accept / decline once for the
//   series) plus "can't make this one" for a single date.
//   Everyone else: a public RSVP link per event, or a private link for one
//   person (a one-on-one). Head count per date.

export type InviteResponse = 'pending' | 'accepted' | 'declined';

interface EventLite {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  location: string | null;
  meeting_link: string | null;
  repeat_weekly: boolean;
  repeat_until: string | null;
  skip_dates: string[] | null;
  created_by: string | null;
  rsvp_token: string | null;
}

const EVENT_COLS =
  'id, title, event_date, start_time, location, meeting_link, repeat_weekly, repeat_until, skip_dates, created_by, rsvp_token';

async function loadEvent(id: string): Promise<EventLite | null> {
  const { data, error } = await getSupabaseAdmin().from('iowa_events').select(EVENT_COLS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as EventLite | null;
}

// "Tuesdays at 8 AM" / "Sun, Oct 4 at 7 PM"
export function whenText(e: Pick<EventLite, 'event_date' | 'start_time' | 'repeat_weekly'>, date?: string): string {
  const time = e.start_time ? ` at ${formatTime(e.start_time)}` : '';
  if (date) return `${formatDate(date)}${time}`;
  if (e.repeat_weekly) {
    const day = formatDate(e.event_date, { weekday: 'long' });
    return `${day}s${time}, weekly`;
  }
  return `${formatDate(e.event_date)}${time}`;
}

// Upcoming dates people can answer for (one-off: its date).
export function upcomingDates(e: EventLite, count = 4, today = chicagoToday()): string[] {
  if (!e.repeat_weekly) return e.event_date >= today ? [e.event_date] : [];
  return eventDatesInRange(e, today, addDays(today, 7 * (count + 6))).slice(0, count);
}

const token = () => randomBytes(24).toString('hex');
const isToken = (t: string) => /^[0-9a-f]{48}$/.test(t);

// ---------------------------------------------------------------------------
// Staff invites
// ---------------------------------------------------------------------------

// Replace who's on an event, keeping everyone's existing answers. New people
// are invited (pending) — except the person doing it, who's in by definition.
// Returns who was newly invited so they can be emailed.
export async function setEventStaff(eventId: string, staffIds: string[], actor: IowaStaff | null): Promise<string[]> {
  const db = getSupabaseAdmin();
  const want = [...new Set(staffIds.filter(Boolean))];
  const { data: rows, error } = await db.from('iowa_event_staff').select('staff_id').eq('event_id', eventId);
  if (error) throw error;
  const had = new Set((rows ?? []).map((r) => r.staff_id as string));
  const added = want.filter((id) => !had.has(id));
  const removed = [...had].filter((id) => !want.includes(id));
  if (removed.length) {
    const { error: dErr } = await db.from('iowa_event_staff').delete().eq('event_id', eventId).in('staff_id', removed);
    if (dErr) throw dErr;
  }
  if (added.length) {
    const now = new Date().toISOString();
    const { error: iErr } = await db.from('iowa_event_staff').insert(
      added.map((staff_id) =>
        staff_id === actor?.id
          ? { event_id: eventId, staff_id, response: 'accepted', responded_at: now }
          : { event_id: eventId, staff_id, response: 'pending' }
      )
    );
    if (iErr) throw iErr;
  }
  return added.filter((id) => id !== actor?.id);
}

export function queueInviteEmails(eventId: string, staffIds: string[], by: IowaStaff | null) {
  if (staffIds.length === 0) return;
  after(async () => {
    try {
      const e = await loadEvent(eventId);
      if (!e) return;
      for (const id of staffIds) {
        const p = await getStaff(id);
        if (!p?.active) continue;
        const base = `${siteUrl()}/iowa/admin/invite/${e.id}`;
        await sendEventInvite({
          to: p.email,
          name: p.name.split(' ')[0],
          by: by?.name ?? null,
          title: e.title,
          when: whenText(e),
          where: e.location ?? (e.meeting_link ? 'Online' : null),
          acceptUrl: `${base}?r=accept`,
          declineUrl: `${base}?r=decline`,
        });
      }
    } catch (err) {
      console.error('[iowa invites] invite email failed', err);
    }
  });
}

// Accept / decline the whole series. Declining (or un-declining) tells whoever
// made the event.
export async function respondToInvite(
  eventId: string,
  staff: IowaStaff,
  response: 'accepted' | 'declined',
  note?: string | null
): Promise<EventLite> {
  const e = await loadEvent(eventId);
  if (!e) throw new Error('That event no longer exists.');
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('iowa_event_staff')
    .update({ response, note: note?.trim() || null, responded_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('staff_id', staff.id)
    .select('staff_id');
  if (error) throw error;
  if (!data?.length) throw new Error('You’re not on this event.');
  if (e.created_by && e.created_by !== staff.id) {
    const creator = e.created_by;
    after(async () => {
      try {
        const c = await getStaff(creator);
        if (c?.active) {
          await sendInviteAnswer({
            to: c.email,
            who: staff.name,
            title: e.title,
            what: response === 'accepted' ? 'is in for' : 'can’t do',
            when: whenText(e),
            note: note?.trim() || null,
          });
        }
      } catch (err) {
        console.error('[iowa invites] answer email failed', err);
      }
    });
  }
  return e;
}

// "I can't make this one" (or take it back) for one date.
export async function setAbsence(eventId: string, staff: IowaStaff, occurrence: string, away: boolean, note?: string | null) {
  if (!isValidDate(occurrence)) throw new Error('Pick a date.');
  const e = await loadEvent(eventId);
  if (!e) throw new Error('That event no longer exists.');
  const db = getSupabaseAdmin();
  if (away) {
    const { error } = await db
      .from('iowa_event_absences')
      .upsert({ event_id: eventId, staff_id: staff.id, occurrence, note: note?.trim() || null }, { onConflict: 'event_id,staff_id,occurrence' });
    if (error) throw error;
  } else {
    const { error } = await db.from('iowa_event_absences').delete().eq('event_id', eventId).eq('staff_id', staff.id).eq('occurrence', occurrence);
    if (error) throw error;
  }
  if (away && e.created_by && e.created_by !== staff.id) {
    const creator = e.created_by;
    after(async () => {
      try {
        const c = await getStaff(creator);
        if (c?.active) {
          await sendInviteAnswer({ to: c.email, who: staff.name, title: e.title, what: 'can’t make', when: whenText(e, occurrence), note: note?.trim() || null });
        }
      } catch (err) {
        console.error('[iowa invites] absence email failed', err);
      }
    });
  }
}

// Waiting on someone's answer — an event invite, or a study-team invite
// (lib/studyTeam.ts). respond_api takes { response, note }; page is the
// email landing page (append ?r=accept|decline).
export interface PendingInvite {
  key: string;
  title: string;
  when: string;
  where: string | null;
  invited_by: string | null;
  respond_api: string;
  page: string;
}

export async function pendingInvitesFor(staffId: string): Promise<PendingInvite[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('iowa_event_staff')
    .select(`event:iowa_events(${EVENT_COLS})`)
    .eq('staff_id', staffId)
    .eq('response', 'pending');
  if (error) throw error;
  const staff = await listStaff();
  const today = chicagoToday();
  return ((data ?? []) as unknown as { event: EventLite | null }[])
    .map((r) => r.event)
    .filter((e): e is EventLite => !!e && (e.repeat_weekly ? !e.repeat_until || e.repeat_until >= today : e.event_date >= today))
    .map((e) => ({
      key: `event:${e.id}`,
      respond_api: `/api/iowa/admin/events/${e.id}/respond`,
      page: `/iowa/admin/invite/${e.id}`,
      title: e.title,
      when: whenText(e),
      where: e.location ?? (e.meeting_link ? 'Online' : null),
      invited_by: staff.find((s) => s.id === e.created_by)?.name ?? null,
    }));
}

// ---------------------------------------------------------------------------
// RSVPs
// ---------------------------------------------------------------------------

export interface Rsvp {
  id: string;
  event_id: string;
  occurrence: string;
  contact_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  response: 'invited' | 'yes' | 'no';
  guests: number;
  note: string | null;
  personal_token: string | null;
}

export async function listRsvps(eventIds: string[]): Promise<Rsvp[]> {
  if (eventIds.length === 0) return [];
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_event_rsvps')
    .select('id, event_id, occurrence, contact_id, name, phone, email, response, guests, note, personal_token')
    .in('event_id', eventIds)
    .gte('occurrence', addDays(chicagoToday(), -14))
    .order('occurrence')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Rsvp[];
}

// Open (or reuse) the event's public RSVP link; close it with open=false.
export async function setRsvpOpen(eventId: string, open: boolean): Promise<string | null> {
  const db = getSupabaseAdmin();
  const e = await loadEvent(eventId);
  if (!e) throw new Error('Event not found.');
  const t = open ? e.rsvp_token ?? token() : null;
  const { error } = await db.from('iowa_events').update({ rsvp_token: t }).eq('id', eventId);
  if (error) throw error;
  return t;
}

export const rsvpUrl = (t: string) => `${siteUrl()}/iowa/rsvp/${t}`;
export const personalUrl = (t: string) => `${siteUrl()}/iowa/rsvp/p/${t}`;

// The same person, whatever they typed: email match, else phone match (last
// ten digits), else a new ARK Iowa contact — so a first-time Taco Night
// guest shows up on the Students page.
async function contactFor(name: string, phone: string | null, email: string | null): Promise<string> {
  const tag = await ensureTag('ARK Iowa', 'role');
  if (email) {
    const c = await findOrCreateContact({ name, email, phone: phone ?? '', source: 'ARK Iowa RSVP', subscribed: false, tagIds: [tag.id] });
    return c.id;
  }
  const digits = (phone ?? '').replace(/\D/g, '').slice(-10);
  if (digits.length === 10) {
    const { data } = await getSupabaseAdmin().from('contacts').select('id, phone').not('phone', 'is', null);
    const hit = (data ?? []).find((c) => (c.phone as string).replace(/\D/g, '').slice(-10) === digits);
    if (hit) return hit.id as string;
  }
  const c = await createContact({ name, email: null, phone, source: 'ARK Iowa RSVP', subscribed: false, tagIds: [tag.id] });
  return c.id;
}

async function saveAnswer(row: {
  event_id: string;
  occurrence: string;
  contact_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  response: 'yes' | 'no';
  guests: number;
  note: string | null;
}) {
  const db = getSupabaseAdmin();
  const { data: existing } = await db
    .from('iowa_event_rsvps')
    .select('id')
    .eq('event_id', row.event_id)
    .eq('occurrence', row.occurrence)
    .eq('contact_id', row.contact_id)
    .maybeSingle();
  const now = new Date().toISOString();
  const { error } = existing
    ? await db.from('iowa_event_rsvps').update({ ...row, updated_at: now }).eq('id', existing.id)
    : await db.from('iowa_event_rsvps').insert(row);
  if (error) throw error;
}

export interface PublicRsvpView {
  title: string;
  location: string | null;
  online: boolean;
  dates: { date: string; label: string }[];
  going: Record<string, number>; // date → head count (yes + guests)
}

export async function publicRsvpView(t: string): Promise<(PublicRsvpView & { eventId: string }) | null> {
  if (!isToken(t)) return null;
  const { data } = await getSupabaseAdmin().from('iowa_events').select(EVENT_COLS).eq('rsvp_token', t).maybeSingle();
  const e = data as EventLite | null;
  if (!e) return null;
  const dates = upcomingDates(e);
  const rsvps = await listRsvps([e.id]);
  const going: Record<string, number> = {};
  for (const r of rsvps) if (r.response === 'yes') going[r.occurrence] = (going[r.occurrence] ?? 0) + 1 + r.guests;
  return {
    eventId: e.id,
    title: e.title,
    location: e.location,
    online: !!e.meeting_link && !e.location,
    dates: dates.map((d) => ({ date: d, label: whenText(e, d) })),
    going,
  };
}

export async function submitPublicRsvp(
  t: string,
  input: { occurrence?: string; name?: string; phone?: string; email?: string; response?: string; guests?: number; note?: string }
): Promise<void> {
  const view = await publicRsvpView(t);
  if (!view) throw new Error('RSVPs for this are closed.');
  const occurrence = input.occurrence && view.dates.some((d) => d.date === input.occurrence) ? input.occurrence : view.dates[0]?.date;
  if (!occurrence) throw new Error('This has already happened.');
  const name = input.name?.trim();
  if (!name) throw new Error('What’s your name?');
  const phone = input.phone?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;
  if (!phone && !email) throw new Error('Add a phone number (or email) so we can reach you.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('That email looks off.');
  if (input.response !== 'yes' && input.response !== 'no') throw new Error('Pick “I’m in” or “Can’t make it.”');
  await saveAnswer({
    event_id: view.eventId,
    occurrence,
    contact_id: await contactFor(name, phone, email),
    name,
    phone,
    email,
    response: input.response,
    guests: Math.max(0, Math.min(10, Math.floor(Number(input.guests) || 0))),
    note: input.note?.trim() || null,
  });
}

// A private invite for one person (a one-on-one, or a nudge to one student).
// Emails them when there's an email; always returns the link to text.
export async function invitePerson(
  eventId: string,
  input: { contact_id?: string; name?: string; phone?: string; email?: string; occurrence?: string },
  by: IowaStaff | null
): Promise<{ url: string; emailed: boolean }> {
  const e = await loadEvent(eventId);
  if (!e) throw new Error('Event not found.');
  const db = getSupabaseAdmin();
  let name = input.name?.trim() ?? '';
  let phone = input.phone?.trim() || null;
  let email = input.email?.trim().toLowerCase() || null;
  let contactId = input.contact_id || null;
  if (contactId) {
    const { data: c } = await db.from('contacts').select('name, phone, email').eq('id', contactId).maybeSingle();
    if (!c) throw new Error('That person isn’t in contacts.');
    name = name || (c.name as string);
    phone = phone ?? (c.phone as string | null);
    email = email ?? (c.email as string | null);
  } else {
    if (!name) throw new Error('Who are you inviting?');
    if (!phone && !email) throw new Error('Add their phone or email.');
    contactId = await contactFor(name, phone, email);
  }
  const occurrence =
    input.occurrence && isValidDate(input.occurrence) ? input.occurrence : upcomingDates(e)[0] ?? e.event_date;

  const { data: existing } = await db
    .from('iowa_event_rsvps')
    .select('id, personal_token')
    .eq('event_id', eventId)
    .eq('occurrence', occurrence)
    .eq('contact_id', contactId)
    .maybeSingle();
  let t = existing?.personal_token as string | null;
  if (!existing) {
    t = token();
    const { error } = await db.from('iowa_event_rsvps').insert({
      event_id: eventId,
      occurrence,
      contact_id: contactId,
      name,
      phone,
      email,
      response: 'invited',
      personal_token: t,
    });
    if (error) throw error;
  } else if (!t) {
    t = token();
    await db.from('iowa_event_rsvps').update({ personal_token: t }).eq('id', existing.id);
  }

  const url = personalUrl(t!);
  let emailed = false;
  if (email) {
    try {
      await sendPersonalRsvp({
        to: email,
        name: name.split(' ')[0],
        by: by?.name?.split(' ')[0] ?? null,
        title: e.title,
        when: whenText(e, occurrence),
        where: e.location ?? (e.meeting_link ? 'Online' : null),
        url,
      });
      emailed = true;
    } catch (err) {
      console.error('[iowa rsvp] personal invite email failed', err);
    }
  }
  return { url, emailed };
}

export async function personalView(t: string): Promise<{
  name: string;
  title: string;
  when: string;
  where: string | null;
  response: Rsvp['response'];
  guests: number;
} | null> {
  if (!isToken(t)) return null;
  const db = getSupabaseAdmin();
  const { data: r } = await db
    .from('iowa_event_rsvps')
    .select('event_id, occurrence, name, response, guests')
    .eq('personal_token', t)
    .maybeSingle();
  if (!r) return null;
  const e = await loadEvent(r.event_id as string);
  if (!e) return null;
  return {
    name: (r.name as string).split(' ')[0],
    title: e.title,
    when: whenText(e, r.occurrence as string),
    where: e.location ?? (e.meeting_link ? 'Online' : null),
    response: r.response as Rsvp['response'],
    guests: r.guests as number,
  };
}

export async function answerPersonal(t: string, response: string, guests?: number, note?: string): Promise<void> {
  if (!isToken(t)) throw new Error('That link doesn’t work.');
  if (response !== 'yes' && response !== 'no') throw new Error('Pick yes or no.');
  const { error, data } = await getSupabaseAdmin()
    .from('iowa_event_rsvps')
    .update({
      response,
      guests: Math.max(0, Math.min(10, Math.floor(Number(guests) || 0))),
      note: note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('personal_token', t)
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new Error('That link doesn’t work.');
}

export async function removeRsvp(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_event_rsvps').delete().eq('id', id);
  if (error) throw error;
}
