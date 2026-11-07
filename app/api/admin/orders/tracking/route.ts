import { NextResponse } from 'next/server';
import { sendPackagesShippedEmail } from '@/lib/email';
import { getOrder, listOrders, updateOrder } from '@/lib/store';
import { applyTracking, matchTracking } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // a December batch can be a few hundred emails

// POST /api/admin/orders/tracking { csv, apply? } — bulk tracking import (lib/tracking.ts).
// Without `apply`: preview only (what matches, what doesn't). With `apply: true`: saves tracking per package
// and emails each buyer once. The file is matched again on apply, so the preview can't go stale.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { csv?: unknown; apply?: unknown };
  const csv = typeof b.csv === 'string' ? b.csv : '';
  if (!csv.trim()) return NextResponse.json({ error: 'Choose a CSV file.' }, { status: 400 });
  if (csv.length > 5_000_000) return NextResponse.json({ error: 'That file is too big.' }, { status: 400 });

  try {
    const { matches, misses, error } = matchTracking(await listOrders(), csv);
    if (error) return NextResponse.json({ error }, { status: 400 });
    if (b.apply !== true) return NextResponse.json({ matches, misses });

    const result = await applyTracking(matches, {
      getOrder,
      updateOrder,
      email: (o, packages, more) => sendPackagesShippedEmail({ to: o.email as string, name: o.name, packages, more }),
    });
    return NextResponse.json({ ...result, misses });
  } catch (e) {
    console.error('[admin tracking]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Import failed.' }, { status: 500 });
  }
}
