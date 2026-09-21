import { NextResponse } from 'next/server';
import { listListableStudies } from '@/lib/bibleStudies';
import { semesterContext } from '@/lib/semesters';

export const dynamic = 'force-dynamic';

// GET /api/iowa/studies — open, joinable studies for the current semester.
// No member data — just slot, location, and spots left. Used by the student
// browser to refresh after a join fills a seat.
export async function GET(req: Request) {
  try {
    // ?semester= only for the current or an open upcoming semester.
    const asked = new URL(req.url).searchParams.get('semester');
    const { active } = await semesterContext();
    const studies = await listListableStudies(asked && active.includes(asked) ? asked : undefined);
    return NextResponse.json({ studies });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
