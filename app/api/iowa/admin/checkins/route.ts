import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { listStudies } from '@/lib/bibleStudies';
import { semesterContext } from '@/lib/semesters';
import { checkinRoster, checkinUrl, ensureCheckin } from '@/lib/semesterCheckins';

export const dynamic = 'force-dynamic';

// Semester check-ins (migration 038), staff side.

// GET ?owner=<staffId> → { semester, people } — returning students (one staff
// member's groups when owner is given) with their link and answer.
export async function GET(req: Request) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const owner = new URL(req.url).searchParams.get('owner');
  try {
    const ctx = await semesterContext();
    return NextResponse.json(await checkinRoster(ctx, await listStudies(ctx.active), owner));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// POST { contactId } → { url, semester } — a check-in for anyone (a dormant or
// never-placed student staff want to ask by hand).
export async function POST(req: Request) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const { contactId } = (await req.json().catch(() => ({}))) as { contactId?: string };
  if (!contactId) return NextResponse.json({ error: 'Which student?' }, { status: 400 });
  const ctx = await semesterContext();
  if (!ctx.next) return NextResponse.json({ error: 'Next semester isn’t open yet.' }, { status: 400 });
  try {
    const c = await ensureCheckin(contactId, ctx.next.name);
    return NextResponse.json({ url: checkinUrl(c.token), semester: ctx.next.name });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
