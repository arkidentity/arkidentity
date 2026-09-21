import { NextResponse } from 'next/server';
import { listStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// GET /api/iowa/met-by — public. The "Who did you meet?" choices on the signup
// forms: first names of active staff + interns only (no emails, no phones).
// Student leaders join the list once they get logins (Phase 3).
export async function GET() {
  try {
    const staff = (await listStaff())
      .filter((s) => s.active && (s.role === 'staff' || s.role === 'intern'))
      .map((s) => ({ id: s.id, name: s.name.split(' ')[0] }));
    return NextResponse.json({ staff }, { headers: { 'Cache-Control': 's-maxage=300' } });
  } catch {
    return NextResponse.json({ staff: [] });
  }
}
