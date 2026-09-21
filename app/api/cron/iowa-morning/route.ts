import { NextResponse } from 'next/server';
import { runMorning } from '@/lib/campusAutomation';

export const maxDuration = 60;

// GET /api/cron/iowa-morning — daily ~8 AM CT (13:00 UTC; 7 AM in winter).
// Confirm-your-studies email + tasks two days out, "did they make it?" for
// yesterday's first-timers, stale-student tasks. Protected by CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await runMorning());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
