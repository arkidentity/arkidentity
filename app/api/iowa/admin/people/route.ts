import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// GET /api/iowa/admin/people?q=sar — people already in the system (ARK Iowa students + staff),
// for picking a study leader instead of typing name / phone / email. A leader can be any
// student; staff are included too. (Staff on point stays its own staff-only picker.)
//
// Built defensively (the first version froze the admin, 2026-10-06, cause unconfirmed):
// plain single-table queries, a hard 4s limit on each, and any failure is just "no results".
type Person = { key: string; name: string; phone: string | null; email: string | null; kind: 'Staff' | 'Student' };

export async function GET(req: Request) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().replace(/[%,()*\\]/g, '').slice(0, 40);
  if (q.length < 2) return NextResponse.json({ people: [] });

  try {
    const db = getSupabaseAdmin();
    const limit = () => AbortSignal.timeout(4000);

    const [{ data: tag }, { data: staff }, { data: named }] = await Promise.all([
      db.from('contact_tags').select('id').eq('slug', 'ark-iowa').abortSignal(limit()).maybeSingle(),
      db.from('iowa_staff').select('id, name, phone, email').eq('active', true).ilike('name', `%${q}%`).limit(6).abortSignal(limit()),
      db.from('contacts').select('id, name, phone, email').ilike('name', `%${q}%`).limit(40).abortSignal(limit()),
    ]);

    // Keep only ARK Iowa people (tagged), checked with one plain lookup
    let students: Person[] = [];
    const ids = (named ?? []).map((c) => c.id as string);
    if (tag?.id && ids.length) {
      const { data: links } = await db.from('contact_tag_links').select('contact_id')
        .eq('tag_id', tag.id).in('contact_id', ids).abortSignal(limit());
      const tagged = new Set((links ?? []).map((l) => l.contact_id as string));
      students = (named ?? []).filter((c) => tagged.has(c.id)).slice(0, 12)
        .map((c) => ({ key: `student:${c.id}`, name: c.name, phone: c.phone, email: c.email, kind: 'Student' }));
    }

    const people: Person[] = [
      ...(staff ?? []).map((p) => ({ key: `staff:${p.id}`, name: p.name, phone: p.phone, email: p.email, kind: 'Staff' as const })),
      ...students,
    ];
    return NextResponse.json({ people });
  } catch (e) {
    console.error('[people search]', e);
    return NextResponse.json({ people: [] });
  }
}
