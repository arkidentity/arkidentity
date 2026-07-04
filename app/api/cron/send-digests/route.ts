import { NextResponse } from 'next/server';
import { runDigests } from '@/lib/digest';

export const maxDuration = 60;

// GET /api/cron/send-digests — invoked daily by Vercel Cron. Sends each due
// partner's email digest. Protected by CRON_SECRET: Vercel automatically sends
// `Authorization: Bearer <CRON_SECRET>` when that env var is set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const summary = await runDigests();
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
