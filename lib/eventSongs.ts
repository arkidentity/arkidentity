import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { IowaStaff } from '@/lib/iowaStaff';

// Songs on one date of an event (migration 025). Server-only. Not a song
// library: a setlist belongs to a date, so this Thursday's practice and next
// Thursday's don't share one. See docs/IOWA-CAMPUS-TASKS.md → "Songs".
//
// Google pushes are queued by the route, not here: calendarSync reads this
// module for the description, so importing it back would be a cycle.

export interface EventSong {
  id: string;
  event_id: string;
  occurrence: string;
  title: string;
  song_key: string | null;
  link: string | null;
  sort: number;
  added_by: string | null;
}

const COLS = 'id, event_id, occurrence, title, song_key, link, sort, added_by';

export async function listSongs(eventIds: string[]): Promise<EventSong[]> {
  if (eventIds.length === 0) return [];
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_event_songs')
    .select(COLS)
    .in('event_id', eventIds)
    .order('occurrence')
    .order('sort');
  if (error) throw error;
  return (data ?? []) as EventSong[];
}

export async function songsFor(eventId: string, occurrence: string): Promise<EventSong[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_event_songs')
    .select(COLS)
    .eq('event_id', eventId)
    .eq('occurrence', occurrence)
    .order('sort');
  if (error) throw error;
  return (data ?? []) as EventSong[];
}

function clean(s: string | null | undefined, max = 200): string | null {
  const v = (s ?? '').trim();
  return v ? v.slice(0, max) : null;
}

export async function addSong(
  eventId: string,
  occurrence: string,
  input: { title: string; song_key?: string | null; link?: string | null },
  by: IowaStaff | null
): Promise<EventSong> {
  const title = clean(input.title);
  if (!title) throw new Error('What song?');
  const existing = await songsFor(eventId, occurrence);
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_event_songs')
    .insert({
      event_id: eventId,
      occurrence,
      title,
      song_key: clean(input.song_key, 12),
      link: clean(input.link, 500),
      sort: (existing.at(-1)?.sort ?? -1) + 1,
      added_by: by?.id ?? null,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return data as EventSong;
}

export async function updateSong(
  id: string,
  patch: { title?: string; song_key?: string | null; link?: string | null }
): Promise<EventSong> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ('title' in patch) {
    const t = clean(patch.title);
    if (!t) throw new Error('A song needs a title.');
    update.title = t;
  }
  if ('song_key' in patch) update.song_key = clean(patch.song_key, 12);
  if ('link' in patch) update.link = clean(patch.link, 500);
  const { data, error } = await getSupabaseAdmin().from('iowa_event_songs').update(update).eq('id', id).select(COLS).single();
  if (error) throw error;
  return data as EventSong;
}

export async function removeSong(id: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from('iowa_event_songs').delete().eq('id', id);
  if (error) throw error;
}

// Drag to reorder: the ids in the order they're played.
export async function reorderSongs(eventId: string, occurrence: string, ids: string[]): Promise<EventSong[]> {
  const db = getSupabaseAdmin();
  for (const [i, id] of ids.entries()) {
    const { error } = await db
      .from('iowa_event_songs')
      .update({ sort: i, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('event_id', eventId)
      .eq('occurrence', occurrence);
    if (error) throw error;
  }
  return songsFor(eventId, occurrence);
}

// "Copy from last time" / "Copy to Sunday": duplicate a set onto another date
// (or another event), appended after whatever is already there.
export async function copySongs(
  from: { eventId: string; occurrence: string },
  to: { eventId: string; occurrence: string },
  by: IowaStaff | null
): Promise<EventSong[]> {
  const source = await songsFor(from.eventId, from.occurrence);
  if (source.length === 0) throw new Error('There are no songs on that date to copy.');
  const existing = await songsFor(to.eventId, to.occurrence);
  let sort = (existing.at(-1)?.sort ?? -1) + 1;
  const { error } = await getSupabaseAdmin().from('iowa_event_songs').insert(
    source.map((s) => ({
      event_id: to.eventId,
      occurrence: to.occurrence,
      title: s.title,
      song_key: s.song_key,
      link: s.link,
      sort: sort++,
      added_by: by?.id ?? null,
    }))
  );
  if (error) throw error;
  return songsFor(to.eventId, to.occurrence);
}

// The most recent date of this event that has songs, before `occurrence`.
export async function previousSetDate(eventId: string, occurrence: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_event_songs')
    .select('occurrence')
    .eq('event_id', eventId)
    .lt('occurrence', occurrence)
    .order('occurrence', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0]?.occurrence as string) ?? null;
}

// One line per song for the Google Calendar description.
export const songLines = (songs: EventSong[]): string[] =>
  songs.map((s, i) => `${i + 1}. ${s.title}${s.song_key ? ` (${s.song_key})` : ''}${s.link ? ` — ${s.link}` : ''}`);
