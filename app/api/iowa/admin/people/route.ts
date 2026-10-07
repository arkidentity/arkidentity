import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET /api/iowa/admin/people?q=sar — people already in the system (ARK Iowa students + staff),
// for picking a study leader instead of typing name / phone / email.
export async function GET(req: Request) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().replace(/[%,()]/g, '');
  if (q.length < 2) return NextResponse.json({ people: [] });
  const db = getSupabaseAdmin();

  const { data: tag } = await db.from('contact_tags').select('id').eq('slug', 'ark-iowa').maybeSingle();
  const [students, staff] = await Promise.all([
    tag
      ? db.from('contacts').select('id, name, phone, email, contact_tag_links!inner(tag_id)')
          .eq('contact_tag_links.tag_id', tag.id).ilike('name', `%${q}%`).limit(12)
      : Promise.resolve({ data: [] as { id: string; name: string; phone: string | null; email: string | null }[] }),
    db.from('iowa_staff').select('id, name, phone, email').eq('active', true).ilike('name', `%${q}%`).limit(6),
  ]);

  const people = [
    ...(staff.data ?? []).map((p) => ({ key: `staff:${p.id}`, name: p.name, phone: p.phone, email: p.email, kind: 'Staff' })),
    ...((students.data ?? []) as { id: string; name: string; phone: string | null; email: string | null }[])
      .map((p) => ({ key: `student:${p.id}`, name: p.name, phone: p.phone, email: p.email, kind: 'Student' })),
  ];
  return NextResponse.json({ people });
}
