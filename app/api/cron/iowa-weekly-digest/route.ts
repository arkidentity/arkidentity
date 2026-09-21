import { NextResponse } from 'next/server';
import { sendWeeklyDigests } from '@/lib/taskDigest';

export const maxDuration = 60;

// GET /api/cron/iowa-weekly-digest — Monday ~7 AM CT (12:00 UTC; 6 AM in
// winter). Each active staff member gets their week: studies they're on point
// for, campus events they're going to, open tasks. Protected by CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await sendWeeklyDigests());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
