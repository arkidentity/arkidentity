import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { takeOverGoogleEvent } from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/events/:id/take-over — a Google-created event becomes an
// admin event (same Google event, now edited here and pushed to Google).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('manageEvents');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  try {
    await takeOverGoogleEvent(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
