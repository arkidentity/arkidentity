import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { dailyDnaConfigured, searchDailyDnaAccounts, syncStudiesToDailyDna } from '@/lib/dailyDnaLink';
import { listStudies } from '@/lib/bibleStudies';

export const dynamic = 'force-dynamic';

// GET /api/iowa/admin/daily-dna?q=sarah — search ARK Iowa's Daily DNA accounts ("Link Daily DNA")
export async function GET(req: Request) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  if (!dailyDnaConfigured()) return NextResponse.json({ error: 'Daily DNA isn’t connected yet (PARTNER_SYNC_SECRET).' }, { status: 503 });
  const q = new URL(req.url).searchParams.get('q') ?? '';
  return NextResponse.json({ accounts: await searchDailyDnaAccounts(q) });
}

// POST /api/iowa/admin/daily-dna — resend every current study to Daily DNA now
export async function POST() {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  if (!dailyDnaConfigured()) return NextResponse.json({ error: 'Daily DNA isn’t connected yet (PARTNER_SYNC_SECRET).' }, { status: 503 });
  const studies = await listStudies();
  await syncStudiesToDailyDna(studies.map((s) => s.id));
  return NextResponse.json({ ok: true, studies: studies.length });
}
