import { getPublicStudy } from '@/lib/bibleStudies';
import { studyIcs } from '@/lib/ics';

export const dynamic = 'force-dynamic';

// GET /api/iowa/studies/:id/ics — the weekly recurring event as a calendar
// file. No personal data in it, so it's safe to serve unauthenticated.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const study = await getPublicStudy(id);
  if (!study) {
    return new Response('Not found', { status: 404 });
  }

  const body = studyIcs({
    id: study.id,
    dayOfWeek: study.day_of_week,
    startTime: study.start_time,
    location: study.location,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ark-iowa-bible-study.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
