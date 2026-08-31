import { NextResponse } from 'next/server';
import { updateCampusStudent, type StudentStatus } from '@/lib/bibleStudies';

export const dynamic = 'force-dynamic';

const STATUSES: StudentStatus[] = ['active', 'dormant', 'graduated', 'transferred', 'left_school'];

// PATCH /api/iowa/admin/students/:contactId — year, life-cycle status, notes.
// Keyed by contact id: the student record hangs off the person, not the seat,
// so it survives them changing studies or having none.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    year?: string | null;
    status?: StudentStatus;
    notes?: string | null;
  };

  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Unknown student status.' }, { status: 400 });
  }

  try {
    await updateCampusStudent(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
