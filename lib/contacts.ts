import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Server-only data access for contacts — every person the ministry knows, in
// one table. Some of them get the newsletter (`subscribed`), some are ARK Iowa
// students, some you met once at a worship night. Superseded lib/partners.ts in
// migration 007. Never import this from the browser.

export type ContactChannel = 'email' | 'text' | 'both';
export type ContactFrequency = 'weekly' | 'monthly';
export type ContactStatus = 'active' | 'archived';

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  relationship_notes: string | null;
  source: string | null;
  status: ContactStatus;
  // Newsletter subscription
  channel: ContactChannel;
  frequency: ContactFrequency;
  subscribed: boolean;
  confirmed: boolean;
  confirm_token: string | null;
  unsubscribe_token: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  created_at: string;
}

export interface ContactWithTags extends Contact {
  tags: Tag[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// The sprawl guard: "Worship Night", "worship night" and "Worship  Night" all
// slug to worship-night, and the unique index on slug rejects the duplicate.
export function tagSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normEmail(email?: string | null): string | null {
  const e = email?.trim().toLowerCase();
  return e || null;
}

function normPhone(phone?: string | null): string | null {
  return phone?.trim() || null;
}

// Two-letter state codes keep segment filters from splitting on "IA" vs "ia".
function normState(state?: string | null): string | null {
  const s = state?.trim().toUpperCase();
  return s || null;
}

export function digitsOf(phone: string): string {
  return phone.replace(/\D/g, '');
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listContacts(
  opts: { includeArchived?: boolean } = {}
): Promise<ContactWithTags[]> {
  const db = getSupabaseAdmin();
  let query = db.from('contacts').select('*').order('created_at', { ascending: false });
  if (!opts.includeArchived) query = query.eq('status', 'active');

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const contacts = (data as Contact[]) ?? [];

  const tagsByContact = await tagsForContacts(contacts.map((c) => c.id));
  return contacts.map((c) => ({ ...c, tags: tagsByContact.get(c.id) ?? [] }));
}

export async function getContact(id: string): Promise<ContactWithTags | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('contacts').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const tagsByContact = await tagsForContacts([data.id]);
  return { ...(data as Contact), tags: tagsByContact.get(data.id) ?? [] };
}

async function tagsForContacts(ids: string[]): Promise<Map<string, Tag[]>> {
  const byContact = new Map<string, Tag[]>();
  if (ids.length === 0) return byContact;

  const { data, error } = await getSupabaseAdmin()
    .from('contact_tag_links')
    .select('contact_id, contact_tags(*)')
    .in('contact_id', ids);
  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as unknown as { contact_id: string; contact_tags: Tag }[]) {
    if (!row.contact_tags) continue;
    const list = byContact.get(row.contact_id) ?? [];
    list.push(row.contact_tags);
    byContact.set(row.contact_id, list);
  }
  for (const list of byContact.values()) list.sort((a, b) => a.name.localeCompare(b.name));
  return byContact;
}

// Existing contacts that look like this person. Quick Add shows these as a
// warning — it never blocks the save, because in a lobby the save has to go
// through and a duplicate is cheaper to merge later than a lost name.
export async function findPossibleDuplicates(input: {
  email?: string | null;
  phone?: string | null;
}): Promise<Contact[]> {
  const db = getSupabaseAdmin();
  const email = normEmail(input.email);
  const digits = input.phone ? digitsOf(input.phone) : '';
  const found = new Map<string, Contact>();

  if (email) {
    const { data } = await db.from('contacts').select('*').ilike('email', email);
    for (const c of (data ?? []) as Contact[]) found.set(c.id, c);
  }
  if (digits.length >= 10) {
    // Stored formatting varies ('(319) 555-1212' vs '3195551212'), so match on
    // the last ten digits rather than the raw string.
    const tail = digits.slice(-10);
    const { data } = await db.from('contacts').select('*').not('phone', 'is', null);
    for (const c of (data ?? []) as Contact[]) {
      if (c.phone && digitsOf(c.phone).slice(-10) === tail) found.set(c.id, c);
    }
  }
  return [...found.values()];
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface CreateContactInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  region?: string | null;
  relationship_notes?: string | null;
  source?: string | null;
  channel?: ContactChannel;
  frequency?: ContactFrequency;
  subscribed?: boolean;
  tagIds?: string[];
}

// Anyone added by hand — Quick Add, the contacts list, CSV import. Trusted, so
// confirmed immediately and subscribed unless the caller says otherwise.
export async function createContact(input: CreateContactInput): Promise<Contact> {
  const db = getSupabaseAdmin();
  const email = normEmail(input.email);

  const { data, error } = await db
    .from('contacts')
    .insert({
      name: input.name.trim(),
      email,
      phone: normPhone(input.phone),
      city: input.city?.trim() || null,
      state: normState(input.state),
      region: input.region?.trim() || null,
      relationship_notes: input.relationship_notes?.trim() || null,
      source: input.source?.trim() || null,
      status: 'active',
      channel: input.channel ?? (email ? 'email' : 'text'),
      frequency: input.frequency ?? 'monthly',
      subscribed: input.subscribed ?? true,
      confirmed: true,
      confirmed_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('A contact with that email already exists.');
    throw new Error(error.message);
  }

  const contact = data as Contact;
  if (input.tagIds?.length) await setContactTags(contact.id, input.tagIds);
  return contact;
}

const EDITABLE: (keyof Contact)[] = [
  'name', 'email', 'phone', 'city', 'state', 'region', 'relationship_notes',
  'source', 'status', 'channel', 'frequency', 'subscribed',
];

export async function updateContact(id: string, patch: Partial<Contact>): Promise<Contact> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of EDITABLE) {
    if (key in patch) update[key] = patch[key];
  }
  if (typeof update.email === 'string') update.email = normEmail(update.email as string);
  if (typeof update.state === 'string') update.state = normState(update.state as string);

  const { data, error } = await getSupabaseAdmin()
    .from('contacts')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Contact;
}

// Contacts are archived, never deleted — the invite history and Bible study
// roster rows that point at them have to stay meaningful.
export async function archiveContact(id: string): Promise<void> {
  await updateContact(id, { status: 'archived', subscribed: false });
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function listTags(): Promise<Tag[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('contact_tags')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Tag[]) ?? [];
}

// Idempotent by slug so "add new tag" inline in Quick Add can't create a near
// duplicate — typing "worship night" when "Worship Night" exists returns that.
export async function ensureTag(name: string, category?: string | null): Promise<Tag> {
  const db = getSupabaseAdmin();
  const slug = tagSlug(name);
  if (!slug) throw new Error('Give the tag a name.');

  const { data: existing } = await db.from('contact_tags').select('*').eq('slug', slug).maybeSingle();
  if (existing) return existing as Tag;

  const { data, error } = await db
    .from('contact_tags')
    .insert({ name: name.trim(), slug, category: category?.trim() || null })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Tag;
}

export async function renameTag(id: string, name: string, category?: string | null): Promise<Tag> {
  const slug = tagSlug(name);
  if (!slug) throw new Error('Give the tag a name.');
  const { data, error } = await getSupabaseAdmin()
    .from('contact_tags')
    .update({ name: name.trim(), slug, category: category?.trim() || null })
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Another tag already uses that name.');
    throw new Error(error.message);
  }
  return data as Tag;
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('contact_tags').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Move every contact on `fromId` to `toId`, then drop the loser. The fix for
// tags that sprawled before the slug guard existed.
export async function mergeTags(fromId: string, toId: string): Promise<void> {
  if (fromId === toId) return;
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('contact_tag_links').select('contact_id').eq('tag_id', fromId);
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((r) => ({ contact_id: r.contact_id, tag_id: toId }));
  if (rows.length) {
    const { error: insErr } = await db
      .from('contact_tag_links')
      .upsert(rows, { onConflict: 'contact_id,tag_id', ignoreDuplicates: true });
    if (insErr) throw new Error(insErr.message);
  }
  await deleteTag(fromId);
}

export async function setContactTags(contactId: string, tagIds: string[]): Promise<void> {
  const db = getSupabaseAdmin();
  const { error: delErr } = await db.from('contact_tag_links').delete().eq('contact_id', contactId);
  if (delErr) throw new Error(delErr.message);
  if (tagIds.length === 0) return;

  const { error } = await db
    .from('contact_tag_links')
    .insert(tagIds.map((tag_id) => ({ contact_id: contactId, tag_id })));
  if (error) throw new Error(error.message);
}

export async function addTagToContacts(tagId: string, contactIds: string[]): Promise<void> {
  if (contactIds.length === 0) return;
  const { error } = await getSupabaseAdmin()
    .from('contact_tag_links')
    .upsert(
      contactIds.map((contact_id) => ({ contact_id, tag_id: tagId })),
      { onConflict: 'contact_id,tag_id', ignoreDuplicates: true }
    );
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Segments — the core of the system. "Colorado AND worship-night AND not yet
// invited to the September event", which Google Contacts labels can't express.
// ---------------------------------------------------------------------------

export interface SegmentFilters {
  states?: string[];
  tagIds?: string[];          // AND: a contact must carry every tag listed
  excludeEventId?: string;    // drop anyone already invited to this event
  subscribedOnly?: boolean;
  search?: string;
}

export async function runSegment(filters: SegmentFilters): Promise<ContactWithTags[]> {
  const db = getSupabaseAdmin();

  // Tags first: intersect the contact ids carrying each tag — AND, not OR. The
  // lists are small enough (hundreds, not millions) that doing it here beats a
  // SQL view.
  const perTag: Set<string>[] = [];
  for (const tagId of filters.tagIds ?? []) {
    const { data, error } = await db.from('contact_tag_links').select('contact_id').eq('tag_id', tagId);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as { contact_id: string }[];
    perTag.push(new Set<string>(rows.map((r) => r.contact_id)));
  }

  let allowed: Set<string> | null = null;
  for (const ids of perTag) {
    const kept: string[] = allowed ? Array.from(allowed).filter((id: string) => ids.has(id)) : Array.from(ids);
    allowed = new Set<string>(kept);
    if (allowed.size === 0) return [];
  }

  let query = db.from('contacts').select('*').eq('status', 'active');
  if (filters.states?.length) {
    query = query.in('state', filters.states.map((s) => s.trim().toUpperCase()));
  }
  if (filters.subscribedOnly) query = query.eq('subscribed', true);
  if (allowed) query = query.in('id', [...allowed]);
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term},city.ilike.${term}`);
  }

  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw new Error(error.message);
  let contacts = (data as Contact[]) ?? [];

  if (filters.excludeEventId) {
    const { data: invited, error: invErr } = await db
      .from('contact_invites')
      .select('contact_id')
      .eq('event_id', filters.excludeEventId);
    if (invErr) throw new Error(invErr.message);
    const already = new Set((invited ?? []).map((r) => r.contact_id as string));
    contacts = contacts.filter((c) => !already.has(c.id));
  }

  const tagsByContact = await tagsForContacts(contacts.map((c) => c.id));
  return contacts.map((c) => ({ ...c, tags: tagsByContact.get(c.id) ?? [] }));
}

// States that actually appear on a contact, for the filter dropdown.
export async function listStates(): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('contacts')
    .select('state')
    .eq('status', 'active')
    .not('state', 'is', null);
  if (error) throw new Error(error.message);
  const states = new Set((data ?? []).map((r) => (r.state as string).toUpperCase()));
  return [...states].sort();
}

// ---------------------------------------------------------------------------
// Events + invites — deliberately thin. RSVPs live in Google Calendar; this
// answers the one thing Calendar can't: who have I already asked?
// ---------------------------------------------------------------------------

export type EventStatus = 'planning' | 'invites_sent' | 'complete';
export type InviteStatus = 'invited' | 'confirmed' | 'declined' | 'no_response';

export interface ContactEvent {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  calendar_link: string | null;
  notes: string | null;
  status: EventStatus;
  created_at: string;
}

export interface EventWithInvites extends ContactEvent {
  invites: { contact: Contact; status: InviteStatus; invited_at: string }[];
}

export async function listEvents(): Promise<(ContactEvent & { invitedCount: number })[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('contact_events')
    .select('*')
    .order('event_date', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  const events = (data as ContactEvent[]) ?? [];
  if (events.length === 0) return [];

  const { data: invites, error: invErr } = await db
    .from('contact_invites')
    .select('event_id')
    .in('event_id', events.map((e) => e.id));
  if (invErr) throw new Error(invErr.message);

  const counts = new Map<string, number>();
  for (const row of invites ?? []) {
    const id = row.event_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return events.map((e) => ({ ...e, invitedCount: counts.get(e.id) ?? 0 }));
}

export async function getEvent(id: string): Promise<EventWithInvites | null> {
  const db = getSupabaseAdmin();
  const { data: event, error } = await db
    .from('contact_events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!event) return null;

  const { data: invites, error: invErr } = await db
    .from('contact_invites')
    .select('status, invited_at, contacts(*)')
    .eq('event_id', id);
  if (invErr) throw new Error(invErr.message);

  const rows = (invites ?? []) as unknown as {
    status: InviteStatus;
    invited_at: string;
    contacts: Contact;
  }[];

  return {
    ...(event as ContactEvent),
    invites: rows
      .filter((r) => r.contacts)
      .map((r) => ({ contact: r.contacts, status: r.status, invited_at: r.invited_at }))
      .sort((a, b) => a.contact.name.localeCompare(b.contact.name)),
  };
}

export async function createEvent(input: {
  name: string;
  event_date?: string | null;
  location?: string | null;
  calendar_link?: string | null;
  notes?: string | null;
}): Promise<ContactEvent> {
  const { data, error } = await getSupabaseAdmin()
    .from('contact_events')
    .insert({
      name: input.name.trim(),
      event_date: input.event_date || null,
      location: input.location?.trim() || null,
      calendar_link: input.calendar_link?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ContactEvent;
}

export async function updateEvent(
  id: string,
  patch: Partial<Pick<ContactEvent, 'name' | 'event_date' | 'location' | 'calendar_link' | 'notes' | 'status'>>
): Promise<ContactEvent> {
  const { data, error } = await getSupabaseAdmin()
    .from('contact_events')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ContactEvent;
}

// Marking people invited is idempotent — re-running a segment and marking it
// again must not reset anyone's status or double-count them.
export async function markInvited(eventId: string, contactIds: string[]): Promise<number> {
  if (contactIds.length === 0) return 0;
  const { error } = await getSupabaseAdmin()
    .from('contact_invites')
    .upsert(
      contactIds.map((contact_id) => ({ event_id: eventId, contact_id })),
      { onConflict: 'event_id,contact_id', ignoreDuplicates: true }
    );
  if (error) throw new Error(error.message);
  return contactIds.length;
}

export async function setInviteStatus(
  eventId: string,
  contactId: string,
  status: InviteStatus
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('contact_invites')
    .update({ status })
    .eq('event_id', eventId)
    .eq('contact_id', contactId);
  if (error) throw new Error(error.message);
}

export async function removeInvite(eventId: string, contactId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('contact_invites')
    .delete()
    .eq('event_id', eventId)
    .eq('contact_id', contactId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Newsletter — carried over from lib/partners.ts.
// ---------------------------------------------------------------------------

export interface ImportRow {
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  channel?: ContactChannel;
  frequency?: ContactFrequency;
}

// Bulk import. Skips rows whose email already exists so re-importing a list
// doesn't create duplicates; phone-only rows are inserted directly.
export async function importContacts(
  rows: ImportRow[],
  opts: { source?: string; tagIds?: string[] } = {}
): Promise<{ imported: number; skipped: number }> {
  const db = getSupabaseAdmin();
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.name?.trim()) {
      skipped++;
      continue;
    }
    const email = normEmail(row.email);
    if (email) {
      const { data: existing } = await db.from('contacts').select('id').ilike('email', email).maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }
    }
    try {
      await createContact({
        name: row.name,
        email,
        phone: row.phone,
        city: row.city,
        state: row.state,
        channel: row.channel,
        frequency: row.frequency,
        source: opts.source ?? 'CSV import',
        tagIds: opts.tagIds,
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return { imported, skipped };
}

// Public subscribe from the feed. No confirmation step: the address goes on the
// list immediately (Travis's call — see 007_contacts.sql). The honeypot on the
// form is what keeps bots off, so don't remove it.
export async function subscribePublic(input: {
  name: string;
  email: string;
  frequency: ContactFrequency;
}): Promise<{ alreadySubscribed: boolean }> {
  const db = getSupabaseAdmin();
  const email = normEmail(input.email)!;

  const { data: existing } = await db
    .from('contacts')
    .select('id, subscribed')
    .ilike('email', email)
    .maybeSingle();

  if (existing) {
    // Already known — a student, a contact you met, or an existing partner.
    // Turn the subscription on rather than creating a second row.
    await db
      .from('contacts')
      .update({
        subscribed: true,
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        frequency: input.frequency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    return { alreadySubscribed: !!existing.subscribed };
  }

  await createContact({
    name: input.name.trim() || email,
    email,
    channel: 'email',
    frequency: input.frequency,
    source: 'Public signup',
    subscribed: true,
  });
  return { alreadySubscribed: false };
}

// Kept for links already sitting in inboxes from the double opt-in era.
export async function confirmSubscriber(token: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from('contacts')
    .update({
      confirmed: true,
      subscribed: true,
      confirmed_at: new Date().toISOString(),
      confirm_token: null,
    })
    .eq('confirm_token', token)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

// Unsubscribing drops the newsletter, not the contact — you still want them in
// segments and on the Bible study roster.
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from('contacts')
    .update({ subscribed: false, updated_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

// Used by the Iowa join flow: find this student's contact row or make one.
// Campus signups default subscribed = false — they signed up for a Bible study,
// not the newsletter.
export async function findOrCreateContact(input: {
  name: string;
  email: string;
  phone: string;
  source?: string;
  subscribed?: boolean;
  tagIds?: string[];
}): Promise<Contact> {
  const db = getSupabaseAdmin();
  const email = normEmail(input.email)!;

  const { data: existing } = await db.from('contacts').select('*').ilike('email', email).maybeSingle();
  if (existing) {
    const contact = existing as Contact;
    // Fill in blanks (an old email-only partner who's now a student), but never
    // overwrite something already there.
    const patch: Record<string, unknown> = {};
    if (!contact.phone && input.phone) patch.phone = normPhone(input.phone);
    if (!contact.name && input.name) patch.name = input.name.trim();
    if (Object.keys(patch).length) {
      patch.updated_at = new Date().toISOString();
      await db.from('contacts').update(patch).eq('id', contact.id);
    }
    if (input.tagIds?.length) {
      for (const tagId of input.tagIds) await addTagToContacts(tagId, [contact.id]);
    }
    return { ...contact, ...(patch as Partial<Contact>) };
  }

  return createContact({
    name: input.name,
    email,
    phone: input.phone,
    source: input.source ?? 'ARK Iowa Bible study',
    subscribed: input.subscribed ?? false,
    tagIds: input.tagIds,
  });
}
