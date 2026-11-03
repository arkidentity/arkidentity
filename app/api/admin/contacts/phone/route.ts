import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// POST /api/admin/contacts/phone — { contactIds, on }. Flags people for Google
// ("On my phone"); the next sync adds them. Turning it off only un-queues
// people who aren't in Google yet; nobody is removed from Google here.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { contactIds?: string[]; on?: boolean };
  const ids = body.contactIds ?? [];
  if (!ids.length) return NextResponse.json({ count: 0 });

  let q = getSupabaseAdmin().from('contacts').update({ on_phone: !!body.on }).in('id', ids);
  if (!body.on) q = q.is('google_resource_name', null);
  const { data, error } = await q.select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length ?? 0, ids: (data ?? []).map((r) => r.id) });
}
