import { NextResponse } from 'next/server';
import { sendStudyReminders } from '@/lib/studyReminders';
import { fullSync } from '@/lib/calendarSync';

export const maxDuration = 60;

// GET /api/cron/iowa-reminders — invoked daily by Vercel Cron (evening CT).
// Emails every active member of every study meeting tomorrow. (Staff task
// reminders moved into the one morning email — lib/campusAutomation.ts.) Also the daily full Google Calendar
// sync, which catches anything an instant push missed. Protected by
// CRON_SECRET: Vercel sends `Authorization: Bearer <CRON_SECRET>` when set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const studies = await sendStudyReminders();
    const calendar = await fullSync().catch((e) => ({ error: (e as Error).message }));
    return NextResponse.json({ ...studies, calendar });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
