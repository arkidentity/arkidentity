import { NextResponse } from 'next/server';
import { sendStudyReminders } from '@/lib/studyReminders';

export const maxDuration = 60;

// GET /api/cron/iowa-reminders — invoked daily by Vercel Cron (evening CT).
// Emails every active member of every study meeting tomorrow. Protected by
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
    const summary = await sendStudyReminders();
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
