import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { digitsOf, tagSlug, type Contact, type Tag } from '@/lib/contacts';

// Two-way sync with the thearkidentity Gmail's Google Contacts (migration 050).
// Google owns the who (name, email, phone, birthday); ARK owns the care. Google
// labels and ARK tags are one system: a label added or removed on either side
// since the last sync wins, decided against the `google_labels_synced` snapshot.
//
// Auth is OAuth (the account is Travis's personal Gmail, so a service account
// can't reach it). The refresh token lives in `google_connection`, server only.
//
// Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (OAuth client "ARK Admin" in the
// ARK Identity Google Cloud project). Node only.

const API = 'https://people.googleapis.com/v1';
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/userinfo.email',
];
const PERSON_FIELDS = 'names,emailAddresses,phoneNumbers,birthdays,memberships,metadata';
// Google stores birthdays without a year; a leap year keeps Feb 29 valid.
const NO_YEAR = 1904;

export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return `${origin}/api/admin/google/callback`;
}

export function authUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // always hand back a refresh token
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

export interface GoogleConnection {
  google_email: string | null;
  connected_at: string;
  last_sync_at: string | null;
  last_sync_summary: SyncSummary | null;
}

export async function getConnection(): Promise<GoogleConnection | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('google_connection')
    .select('google_email, connected_at, last_sync_at, last_sync_summary')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as GoogleConnection) ?? null;
}

export async function connectWithCode(origin: string, code: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; refresh_token?: string };
  if (!data.refresh_token) throw new Error('Google did not return a refresh token. Try connecting again.');

  let email: string | null = null;
  const who = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  if (who.ok) email = ((await who.json()) as { email?: string }).email ?? null;

  const { error } = await getSupabaseAdmin()
    .from('google_connection')
    .upsert({ id: 1, google_email: email, refresh_token: data.refresh_token, connected_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return email;
}

export async function disconnect(): Promise<void> {
  const { error } = await getSupabaseAdmin().from('google_connection').delete().eq('id', 1);
  if (error) throw new Error(error.message);
}

async function accessToken(): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .from('google_connection')
    .select('refresh_token')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Google Contacts is not connected.');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: data.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    // invalid_grant = revoked, or expired after 7 days while the app is in Testing.
    throw new Error(`Google access expired or was removed. Click Reconnect. (${res.status})`);
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

async function api<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new Error(`Google Contacts ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Google shapes
// ---------------------------------------------------------------------------

interface GGroup { resourceName: string; name: string; groupType: string }
interface GPerson {
  resourceName: string;
  etag?: string;
  names?: { displayName?: string; metadata?: { primary?: boolean } }[];
  emailAddresses?: { value?: string; metadata?: { primary?: boolean } }[];
  phoneNumbers?: { value?: string; metadata?: { primary?: boolean } }[];
  birthdays?: { date?: { year?: number; month?: number; day?: number } }[];
  memberships?: { contactGroupMembership?: { contactGroupResourceName?: string } }[];
}

function primary<T extends { metadata?: { primary?: boolean } }>(list?: T[]): T | undefined {
  return list?.find((x) => x.metadata?.primary) ?? list?.[0];
}

function personName(p: GPerson): string | null {
  return primary(p.names)?.displayName?.trim() || null;
}
function personEmail(p: GPerson): string | null {
  return primary(p.emailAddresses)?.value?.trim().toLowerCase() || null;
}
function personPhone(p: GPerson): string | null {
  return primary(p.phoneNumbers)?.value?.trim() || null;
}
function personBirthday(p: GPerson): string | null {
  const d = p.birthdays?.find((b) => b.date?.month && b.date?.day)?.date;
  if (!d?.month || !d.day) return null;
  const y = d.year || NO_YEAR;
  return `${y}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

// Match phones on the last 10 digits so "+1 (515) 555-0100" == "515.555.0100".
function phoneKey(phone?: string | null): string | null {
  const d = phone ? digitsOf(phone) : '';
  return d.length >= 7 ? d.slice(-10) : null;
}

async function listGroups(token: string): Promise<GGroup[]> {
  const out: GGroup[] = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({ pageSize: '1000', ...(pageToken ? { pageToken } : {}) });
    const data = await api<{ contactGroups?: GGroup[]; nextPageToken?: string }>(token, `contactGroups?${q}`);
    out.push(...(data.contactGroups ?? []));
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return out.filter((g) => g.groupType === 'USER_CONTACT_GROUP');
}

async function listPeople(token: string): Promise<GPerson[]> {
  const out: GPerson[] = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({
      personFields: PERSON_FIELDS,
      pageSize: '1000',
      ...(pageToken ? { pageToken } : {}),
    });
    const data = await api<{ connections?: GPerson[]; nextPageToken?: string }>(
      token,
      `people/me/connections?${q}`
    );
    out.push(...(data.connections ?? []));
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

export interface SyncSummary {
  dryRun: boolean;
  googlePeople: number;
  linked: string[];          // matched to an existing ARK contact for the first time
  imported: string[];        // new in ARK, from Google (not subscribed)
  pushed: string[];          // ARK-only people added to Google
  filled: number;            // ARK contacts that got a blank field from Google
  tagsCreated: string[];     // Google labels that became ARK tags
  groupsCreated: string[];   // ARK tags that became Google labels
  arkLabelChanges: number;   // tags added/removed in ARK
  googleLabelChanges: number;// labels added/removed in Google
  skipped: number;           // Google entries with no name, email or phone
}

interface LogRow { contact_id: string | null; action: string; detail: string }

/**
 * Run (or preview, with dryRun) one full sync. ARK contacts switched to
 * "On my phone" that aren't in Google yet are added to Google, with labels.
 */
export async function syncGoogleContacts(opts: { dryRun: boolean }): Promise<SyncSummary> {
  const { dryRun } = opts;
  const db = getSupabaseAdmin();
  const token = await accessToken();
  const log: LogRow[] = [];

  const summary: SyncSummary = {
    dryRun, googlePeople: 0, linked: [], imported: [], pushed: [], filled: 0,
    tagsCreated: [], groupsCreated: [], arkLabelChanges: 0, googleLabelChanges: 0, skipped: 0,
  };

  const [groups, people] = await Promise.all([listGroups(token), listPeople(token)]);
  summary.googlePeople = people.length;

  const { data: contactRows, error: cErr } = await db.from('contacts').select('*');
  if (cErr) throw new Error(cErr.message);
  const contacts = (contactRows ?? []) as (Contact & {
    google_resource_name: string | null;
    google_labels_synced: string[] | null;
  })[];

  const { data: tagRows, error: tErr } = await db.from('contact_tags').select('*');
  if (tErr) throw new Error(tErr.message);
  const tags = (tagRows ?? []) as (Tag & { google_group_resource_name: string | null })[];

  const { data: linkRows, error: lErr } = await db.from('contact_tag_links').select('contact_id, tag_id');
  if (lErr) throw new Error(lErr.message);

  // Google ids of duplicates merged away in ARK (migration 052): skip them so
  // the duplicate isn't imported again before it's merged in Google too.
  const { data: awayRows } = await db.from('google_merged_away').select('resource_name');
  const mergedAway = new Set((awayRows ?? []).map((r) => r.resource_name as string));

  // ---- 1. Labels <-> tags, matched by group id, then by slug ---------------
  const tagBySlug = new Map(tags.map((t) => [t.slug, t]));
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const slugByGroup = new Map<string, string>();
  const groupBySlug = new Map<string, string>();

  for (const g of groups) {
    const slug = tagSlug(g.name);
    if (!slug) continue;
    let tag = tags.find((t) => t.google_group_resource_name === g.resourceName) ?? tagBySlug.get(slug);
    if (!tag) {
      summary.tagsCreated.push(g.name);
      if (!dryRun) {
        const { data, error } = await db
          .from('contact_tags')
          .insert({ name: g.name.trim(), slug, google_group_resource_name: g.resourceName })
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        tag = data as Tag & { google_group_resource_name: string | null };
      } else {
        tag = { id: `new:${slug}`, name: g.name, slug, category: null, created_at: '', google_group_resource_name: g.resourceName };
      }
      tagBySlug.set(slug, tag);
      tagById.set(tag.id, tag);
    } else if (tag.google_group_resource_name !== g.resourceName && !dryRun) {
      await db.from('contact_tags').update({ google_group_resource_name: g.resourceName }).eq('id', tag.id);
    }
    slugByGroup.set(g.resourceName, tag.slug);
    groupBySlug.set(tag.slug, g.resourceName);
  }

  const arkSlugs = new Map<string, Set<string>>();
  for (const l of linkRows ?? []) {
    const t = tagById.get(l.tag_id);
    if (!t) continue;
    const set = arkSlugs.get(l.contact_id) ?? new Set<string>();
    set.add(t.slug);
    arkSlugs.set(l.contact_id, set);
  }

  // A Google label is needed for every tag that a Google-synced person carries.
  async function ensureGroup(slug: string): Promise<string | null> {
    const existing = groupBySlug.get(slug);
    if (existing) return existing;
    const tag = tagBySlug.get(slug);
    if (!tag) return null;
    summary.groupsCreated.push(tag.name);
    if (dryRun) {
      groupBySlug.set(slug, `new:${slug}`);
      return `new:${slug}`;
    }
    const g = await api<GGroup>(token, 'contactGroups', {
      method: 'POST',
      body: JSON.stringify({ contactGroup: { name: tag.name } }),
    });
    await db.from('contact_tags').update({ google_group_resource_name: g.resourceName }).eq('id', tag.id);
    groupBySlug.set(slug, g.resourceName);
    slugByGroup.set(g.resourceName, slug);
    log.push({ contact_id: null, action: 'group_created', detail: tag.name });
    return g.resourceName;
  }

  // ---- 2. Match Google people to ARK contacts ------------------------------
  const byResource = new Map<string, (typeof contacts)[number]>();
  const byEmail = new Map<string, (typeof contacts)[number]>();
  const byPhone = new Map<string, (typeof contacts)[number]>();
  for (const c of contacts) {
    if (c.google_resource_name) byResource.set(c.google_resource_name, c);
    if (c.email) byEmail.set(c.email.toLowerCase(), c);
    const pk = phoneKey(c.phone);
    if (pk && !byPhone.has(pk)) byPhone.set(pk, c);
  }

  const claimed = new Set<string>(); // ARK ids already matched this run
  const pairs: { contactId: string; person: GPerson }[] = [];

  for (const p of people) {
    if (mergedAway.has(p.resourceName)) continue;
    const name = personName(p);
    const email = personEmail(p);
    const phone = personPhone(p);
    if (!name && !email && !phone) { summary.skipped++; continue; }

    let c = byResource.get(p.resourceName);
    const firstLink = !c;
    if (!c && email) c = byEmail.get(email);
    if (!c && phone) { const pk = phoneKey(phone); if (pk) c = byPhone.get(pk); }
    if (c && claimed.has(c.id)) c = undefined; // two Google entries for one person: second imports

    if (c) {
      claimed.add(c.id);
      const label = c.name || name || email || phone || '';
      // Google wins once linked; on the first link only blanks are filled.
      const patch: Record<string, unknown> = {};
      if (firstLink) {
        patch.google_resource_name = p.resourceName;
        patch.on_phone = true;
        summary.linked.push(label);
        log.push({ contact_id: c.id, action: 'linked', detail: label });
        if (!c.email && email && !byEmail.has(email)) patch.email = email;
        if (!c.phone && phone) patch.phone = phone;
        if (!c.name && name) patch.name = name;
      } else {
        if (name && name !== c.name) patch.name = name;
        if (email && email !== c.email && !byEmail.has(email)) patch.email = email;
        if (phone && phone !== c.phone) patch.phone = phone;
      }
      const bday = personBirthday(p);
      if (bday && bday !== (c as unknown as { birthday?: string | null }).birthday) patch.birthday = bday;
      const filledKeys = Object.keys(patch).filter((k) => k !== 'google_resource_name');
      if (filledKeys.length) {
        summary.filled++;
        log.push({ contact_id: c.id, action: 'filled', detail: filledKeys.join(', ') });
      }
      patch.google_etag = p.etag ?? null;
      patch.synced_at = new Date().toISOString();
      if (!dryRun) {
        const { error } = await db.from('contacts').update(patch).eq('id', c.id);
        if (error) throw new Error(`${label}: ${error.message}`);
      }
      pairs.push({ contactId: c.id, person: p });
    } else {
      const label = name || email || phone || '';
      summary.imported.push(label);
      if (!dryRun) {
        const { data, error } = await db
          .from('contacts')
          .insert({
            name: name || email || phone,
            email: email && !byEmail.has(email) ? email : null,
            phone,
            birthday: personBirthday(p),
            source: 'google-contacts',
            status: 'active',
            channel: email ? 'email' : 'text',
            frequency: 'monthly',
            subscribed: false, // the sync never adds anyone to the newsletter
            confirmed: true,
            confirmed_at: new Date().toISOString(),
            google_resource_name: p.resourceName,
            google_etag: p.etag ?? null,
            on_phone: true,
            synced_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (error) throw new Error(`${label}: ${error.message}`);
        log.push({ contact_id: data.id, action: 'imported', detail: label });
        if (email) byEmail.set(email, { id: data.id } as (typeof contacts)[number]);
        pairs.push({ contactId: data.id, person: p });
      } else {
        pairs.push({ contactId: `new:${p.resourceName}`, person: p });
      }
    }
  }

  // ---- 3. Two-way labels for every matched pair ----------------------------
  const snapshotById = new Map(contacts.map((c) => [c.id, c.google_labels_synced]));
  const groupAdds = new Map<string, string[]>();
  const groupRemoves = new Map<string, string[]>();
  const tagAdds: { contact_id: string; tag_id: string }[] = [];
  const tagRemoves: { contact_id: string; tag_id: string }[] = [];
  const snapshots: { id: string; slugs: string[] }[] = [];

  for (const { contactId, person } of pairs) {
    const G = new Set<string>();
    for (const m of person.memberships ?? []) {
      const slug = slugByGroup.get(m.contactGroupMembership?.contactGroupResourceName ?? '');
      if (slug) G.add(slug);
    }
    const A = arkSlugs.get(contactId) ?? new Set<string>();
    const S = snapshotById.get(contactId);

    const R = new Set<string>();
    if (!S) {
      for (const s of A) R.add(s);
      for (const s of G) R.add(s);
    } else {
      const snap = new Set(S);
      for (const s of snap) if (A.has(s) && G.has(s)) R.add(s);       // kept on both sides
      for (const s of A) if (!snap.has(s)) R.add(s);                   // added in ARK
      for (const s of G) if (!snap.has(s)) R.add(s);                   // added in Google
    }

    for (const s of R) {
      if (!A.has(s)) {
        const t = tagBySlug.get(s);
        if (t) tagAdds.push({ contact_id: contactId, tag_id: t.id });
      }
      if (!G.has(s)) {
        const g = await ensureGroup(s);
        if (g) groupAdds.set(g, [...(groupAdds.get(g) ?? []), person.resourceName]);
      }
    }
    for (const s of A) {
      if (R.has(s)) continue;
      const t = tagBySlug.get(s);
      if (t) tagRemoves.push({ contact_id: contactId, tag_id: t.id });
    }
    for (const s of G) {
      if (R.has(s)) continue;
      const g = groupBySlug.get(s);
      if (g) groupRemoves.set(g, [...(groupRemoves.get(g) ?? []), person.resourceName]);
    }
    snapshots.push({ id: contactId, slugs: [...R].sort() });
  }

  summary.arkLabelChanges = tagAdds.length + tagRemoves.length;
  for (const list of [...groupAdds.values(), ...groupRemoves.values()]) summary.googleLabelChanges += list.length;

  // ---- 4. ARK-only people into Google --------------------------------------
  const toPush = contacts.filter(
    (c) => c.on_phone && c.status === 'active' && !claimed.has(c.id) && !c.google_resource_name && (c.email || c.phone)
  );
  for (const c of toPush) summary.pushed.push(c.name);

  if (dryRun) return summary;

  // ---- Apply writes ----------------------------------------------------------
  if (tagAdds.length) {
    const { error } = await db.from('contact_tag_links').upsert(tagAdds, { onConflict: 'contact_id,tag_id', ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    for (const r of tagAdds) log.push({ contact_id: r.contact_id, action: 'label_added', detail: `ARK: ${tagById.get(r.tag_id)?.name ?? r.tag_id}` });
  }
  for (const r of tagRemoves) {
    await db.from('contact_tag_links').delete().eq('contact_id', r.contact_id).eq('tag_id', r.tag_id);
    log.push({ contact_id: r.contact_id, action: 'label_removed', detail: `ARK: ${tagById.get(r.tag_id)?.name ?? r.tag_id}` });
  }

  const groupNames = new Map([...slugByGroup].map(([g, s]) => [g, tagBySlug.get(s)?.name ?? s]));
  const allGroups = new Set([...groupAdds.keys(), ...groupRemoves.keys()]);
  for (const g of allGroups) {
    const add = groupAdds.get(g) ?? [];
    const remove = groupRemoves.get(g) ?? [];
    for (let i = 0; i < Math.max(add.length, remove.length); i += 1000) {
      await api(token, `${g}/members:modify`, {
        method: 'POST',
        body: JSON.stringify({
          resourceNamesToAdd: add.slice(i, i + 1000),
          resourceNamesToRemove: remove.slice(i, i + 1000),
        }),
      });
    }
    if (add.length) log.push({ contact_id: null, action: 'label_added', detail: `Google: ${groupNames.get(g)} +${add.length}` });
    if (remove.length) log.push({ contact_id: null, action: 'label_removed', detail: `Google: ${groupNames.get(g)} -${remove.length}` });
  }

  for (const s of snapshots) {
    await db.from('contacts').update({ google_labels_synced: s.slugs }).eq('id', s.id);
  }

  // New Google contacts carry their labels from the start.
  for (let i = 0; i < toPush.length; i += 200) {
    const batch = toPush.slice(i, i + 200);
    const bodies = [];
    for (const c of batch) {
      const memberships = [];
      for (const s of arkSlugs.get(c.id) ?? []) {
        const g = await ensureGroup(s);
        if (g) memberships.push({ contactGroupMembership: { contactGroupResourceName: g } });
      }
      bodies.push({
        contactPerson: {
          names: [{ unstructuredName: c.name }],
          ...(c.email ? { emailAddresses: [{ value: c.email }] } : {}),
          ...(c.phone ? { phoneNumbers: [{ value: c.phone }] } : {}),
          ...(memberships.length ? { memberships } : {}),
        },
      });
    }
    const res = await api<{ createdPeople?: { person?: GPerson }[] }>(token, 'people:batchCreateContacts', {
      method: 'POST',
      body: JSON.stringify({ contacts: bodies, readMask: 'names,emailAddresses,phoneNumbers' }),
    });
    const created = res.createdPeople ?? [];
    for (let j = 0; j < batch.length; j++) {
      const c = batch[j];
      // Match the created person back by email, then phone, then position.
      const person =
        created.find((x) => c.email && x.person && personEmail(x.person) === c.email.toLowerCase())?.person ??
        created.find((x) => c.phone && x.person && phoneKey(personPhone(x.person)) === phoneKey(c.phone))?.person ??
        created[j]?.person;
      if (!person?.resourceName) continue;
      await db
        .from('contacts')
        .update({
          google_resource_name: person.resourceName,
          google_etag: person.etag ?? null,
          google_labels_synced: [...(arkSlugs.get(c.id) ?? [])].sort(),
          synced_at: new Date().toISOString(),
        })
        .eq('id', c.id);
      log.push({ contact_id: c.id, action: 'pushed', detail: c.name });
    }
  }

  if (log.length) {
    for (let i = 0; i < log.length; i += 500) {
      await db.from('contact_sync_log').insert(log.slice(i, i + 500));
    }
  }
  await db
    .from('google_connection')
    .update({ last_sync_at: new Date().toISOString(), last_sync_summary: summary })
    .eq('id', 1);

  return summary;
}

// ---------------------------------------------------------------------------
// ARK edits -> Google, right away
// ---------------------------------------------------------------------------

/**
 * Send an ARK edit of name, email or phone to the linked Google contact, so the
 * next sync reads the new value instead of putting the old one back. Only the
 * primary email and phone are replaced; any others in Google are kept.
 * Returns false when there is nothing to push (not linked, not connected).
 */
export async function pushContactToGoogle(contact: {
  name: string;
  email: string | null;
  phone: string | null;
  google_resource_name?: string | null;
}): Promise<boolean> {
  const rn = contact.google_resource_name;
  if (!rn || !googleConfigured() || !(await getConnection())) return false;
  const token = await accessToken();

  const person = await api<GPerson>(token, `${rn}?personFields=names,emailAddresses,phoneNumbers`);

  function replacePrimary<T extends { value?: string; metadata?: { primary?: boolean } }>(
    list: T[] | undefined,
    value: string | null
  ): { value: string }[] {
    const rest = (list ?? []).filter((x) => x !== primary(list)).map((x) => ({ value: x.value ?? '' })).filter((x) => x.value);
    return value ? [{ value }, ...rest] : rest;
  }

  const updated = await api<GPerson>(
    token,
    `${rn}:updateContact?updatePersonFields=names,emailAddresses,phoneNumbers`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        etag: person.etag,
        names: [{ unstructuredName: contact.name }],
        emailAddresses: replacePrimary(person.emailAddresses, contact.email),
        phoneNumbers: replacePrimary(person.phoneNumbers, contact.phone),
      }),
    }
  );
  await getSupabaseAdmin()
    .from('contacts')
    .update({ google_etag: updated.etag ?? null, synced_at: new Date().toISOString() })
    .eq('google_resource_name', rn);
  return true;
}
