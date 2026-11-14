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

// POST { contactId } → { url, semester } — a next-semester check-in for anyone (a dormant or
// never-placed student staff want to ask by hand).
// POST { contactIds, current: true } → { semester, from, links: [{ contactId, url }] } — the
// same link for THIS semester, so students waiting for a study can pick their free times
// (Studies → Waiting for a study → Text them for times).
export async function POST(req: Request) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const body = (await req.json().catch(() => ({}))) as { contactId?: string; contactIds?: string[]; current?: boolean };
  const ctx = await semesterContext();
  if (body.current) {
    if (!ctx.current) return NextResponse.json({ error: 'No current semester is set.' }, { status: 400 });
    const ids = (body.contactIds ?? []).filter((x) => typeof x === 'string').slice(0, 200);
    try {
      const links = await Promise.all(
        ids.map(async (contactId) => ({ contactId, url: checkinUrl((await ensureCheckin(contactId, ctx.current!.name)).token) }))
      );
      return NextResponse.json({ semester: ctx.current.name, from: me.name.split(' ')[0], links });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }
  const { contactId } = body;
  if (!contactId) return NextResponse.json({ error: 'Which student?' }, { status: 400 });
  if (!ctx.next) return NextResponse.json({ error: 'Next semester isn’t open yet.' }, { status: 400 });
  try {
    const c = await ensureCheckin(contactId, ctx.next.name);
    return NextResponse.json({ url: checkinUrl(c.token), semester: ctx.next.name });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
