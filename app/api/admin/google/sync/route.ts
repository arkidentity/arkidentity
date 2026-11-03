import { NextResponse } from 'next/server';
import { syncGoogleContacts } from '@/lib/googleContacts';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST /api/admin/google/sync — { dryRun }. Preview first: a dry
// run reads both sides and reports what would change without writing anything.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean };
  try {
    const summary = await syncGoogleContacts({
      dryRun: body.dryRun !== false,
    });
    return NextResponse.json({ summary });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sync failed.' }, { status: 500 });
  }
}
