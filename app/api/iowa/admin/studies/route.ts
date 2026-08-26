import { NextResponse } from 'next/server';
import { listStudies, createStudy } from '@/lib/bibleStudies';

export const dynamic = 'force-dynamic';

// GET /api/iowa/admin/studies — every study in the semester, rosters attached.
export async function GET() {
  try {
    const studies = await listStudies();
    return NextResponse.json({ studies });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/iowa/admin/studies — create a study (starts `forming`).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    dayOfWeek?: number;
    startTime?: string;
    location?: string;
    capacity?: number;
    leaderName?: string;
    leaderPhone?: string;
    leaderEmail?: string;
    notes?: string;
    addLeaderAsMember?: boolean;
  };

  const day = Number(body.dayOfWeek);
  if (!Number.isInteger(day) || day < 0 || day > 6) return bad('Pick a day.');
  if (!body.startTime || !/^\d{2}:\d{2}$/.test(body.startTime)) return bad('Pick a time (HH:MM).');
  if (!body.location?.trim()) return bad('A study needs a location before it can be listed.');

  try {
    const study = await createStudy({
      day_of_week: day,
      start_time: body.startTime,
      location: body.location,
      capacity: body.capacity,
      leader_name: body.leaderName,
      leader_phone: body.leaderPhone,
      leader_email: body.leaderEmail,
      notes: body.notes,
      addLeaderAsMember: body.addLeaderAsMember,
    });
    return NextResponse.json({ study }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
