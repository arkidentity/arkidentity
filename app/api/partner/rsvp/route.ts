import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidDate } from '@/lib/campusFormat';

export const dynamic = 'force-dynamic';

// POST /api/partner/rsvp — Daily DNA's Going button (Daily DNA Mig 340, Travis 11/2).
// Auth: Bearer PARTNER_SYNC_SECRET (same value in both apps).
// { eventKey: iowa_events.id, occurrence: 'YYYY-MM-DD', accountId, name, email, going, guests }
// A student whose Daily DNA account is linked (campus_students.daily_dna_account_id) is saved as that contact;
// anyone else by their Daily DNA name + email. Rows made here carry the note FROM_DNA, so undoing Going only
// removes what Daily DNA added, never an RSVP someone made on the public link.
const FROM_DNA = 'From Daily DNA';

export async function POST(req: Request) {
  if (!process.env.PARTNER_SYNC_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.PARTNER_SYNC_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const b = (await req.json().catch(() => ({}))) as {
    eventKey?: string; occurrence?: string; accountId?: string; name?: string | null; email?: string | null; going?: boolean; guests?: number;
  };
  if (!b.eventKey || !b.accountId || !b.occurrence || !isValidDate(b.occurrence)) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const db = getSupabaseAdmin();

  const { data: event } = await db.from('iowa_events').select('id').eq('id', b.eventKey).maybeSingle();
  if (!event) return NextResponse.json({ error: 'unknown event' }, { status: 404 });

  const { data: student } = await db.from('campus_students').select('contact_id').eq('daily_dna_account_id', b.accountId).maybeSingle();
  const contact = student?.contact_id
    ? (await db.from('contacts').select('id, name, phone, email').eq('id', student.contact_id).maybeSingle()).data
    : null;
  const email = (contact?.email ?? b.email ?? '').trim().toLowerCase() || null;

  let find = db.from('iowa_event_rsvps').select('id, note').eq('event_id', event.id).eq('occurrence', b.occurrence);
  find = contact ? find.eq('contact_id', contact.id) : email ? find.is('contact_id', null).eq('email', email) : find.eq('note', `${FROM_DNA}:${b.accountId}`);
  const { data: existing } = await find.limit(1).maybeSingle();

  if (!b.going) {
    if (existing && (existing.note ?? '').startsWith(FROM_DNA)) await db.from('iowa_event_rsvps').delete().eq('id', existing.id);
    return NextResponse.json({ ok: true });
  }
  const row = {
    event_id: event.id, occurrence: b.occurrence, contact_id: contact?.id ?? null,
    name: (contact?.name ?? b.name ?? 'Someone').slice(0, 200), phone: contact?.phone ?? null, email,
    response: 'yes' as const, guests: Math.max(0, Math.min(10, Math.round(b.guests ?? 0))),
    updated_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await db.from('iowa_event_rsvps').update(row).eq('id', existing.id)
    : await db.from('iowa_event_rsvps').insert({ ...row, note: contact || email ? FROM_DNA : `${FROM_DNA}:${b.accountId}` });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
