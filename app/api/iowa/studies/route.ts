import { NextResponse } from 'next/server';
import { listListableStudies } from '@/lib/bibleStudies';

export const dynamic = 'force-dynamic';

// GET /api/iowa/studies — open, joinable studies for the current semester.
// No member data — just slot, location, and spots left. Used by the student
// browser to refresh after a join fills a seat.
export async function GET() {
  try {
    const studies = await listListableStudies();
    return NextResponse.json({ studies });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
