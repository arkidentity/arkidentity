import { NextResponse } from 'next/server';
import { runEveningDigest } from '@/lib/notifications';

export const maxDuration = 60;

// GET /api/cron/iowa-evening — daily ~6 PM CT (23:05 UTC; 5 PM in winter),
// Monday–Saturday. One email per person for everything that happened today:
// tasks they were given, notes on their tasks, offers to help. Skipped when
// empty. Protected by CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await runEveningDigest());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
