import { NextResponse } from 'next/server';
import { currentStaff } from '@/lib/iowaStaff';
import { isValidDate } from '@/lib/campusFormat';
import { listAttendance, saveAttendance } from '@/lib/studyAttendance';
import { studyHealth } from '@/lib/studyHealthFormat';

export const dynamic = 'force-dynamic';

// Launch attendance for one study (migration 037). Anyone signed in who can
// open the study's popup can take it — staff, interns, and later the group's
// own student leader.

// GET → { rows, health }
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentStaff())) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  const { id } = await params;
  const rows = await listAttendance([id]);
  return NextResponse.json({ rows, health: studyHealth(rows) });
}

// POST { occurrence, marks: [{ contact_id, present }] } → { rows, health }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { occurrence?: string; marks?: { contact_id: string; present: boolean }[] };
  if (!body.occurrence || !isValidDate(body.occurrence)) return NextResponse.json({ error: 'Which date?' }, { status: 400 });
  const marks = (body.marks ?? []).filter((m) => typeof m.contact_id === 'string').map((m) => ({ contact_id: m.contact_id, present: !!m.present }));
  try {
    await saveAttendance(id, body.occurrence, marks, me);
    const rows = await listAttendance([id]);
    return NextResponse.json({ rows, health: studyHealth(rows) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
