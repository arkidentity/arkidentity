import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { getStudentHistory } from '@/lib/studentHistory';

export const dynamic = 'force-dynamic';

// GET /api/iowa/admin/students/:contactId/history — the dated timeline.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  try {
    return NextResponse.json({ history: await getStudentHistory(id) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
