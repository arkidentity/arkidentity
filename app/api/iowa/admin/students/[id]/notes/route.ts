import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { addStudentNote } from '@/lib/studentHistory';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/students/:contactId/notes   { body }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const { body } = (await req.json().catch(() => ({}))) as { body?: string };
  try {
    return NextResponse.json({ entry: await addStudentNote(id, body ?? '', me) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
