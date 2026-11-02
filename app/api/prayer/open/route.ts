import { NextResponse } from 'next/server';
import { automationAuthorized } from '@/lib/automationToken';
import { listPrayerRequests } from '@/lib/prayer';

export const dynamic = 'force-dynamic';

// GET /api/prayer/open — for Travis's morning routines: open requests and
// follow-ups that are due. Bearer FEED_DRAFT_TOKEN. Read-only.
export async function GET(req: Request) {
  if (!automationAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  const rows = await listPrayerRequests();
  const pick = (r: (typeof rows)[number]) => ({
    name: r.name,
    partner: !!r.contact_id,
    request: r.request,
    wants_update: r.wants_update,
    received: r.created_at.slice(0, 10),
    prayed: r.prayed_at?.slice(0, 10) ?? null,
  });
  return NextResponse.json({
    open: rows.filter((r) => r.status === 'open').map(pick),
    follow_up_due: rows.filter((r) => r.status === 'prayed' && r.follow_up_on && r.follow_up_on <= today).map(pick),
    admin: '/admin/prayer',
  });
}
