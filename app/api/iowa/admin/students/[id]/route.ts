import { NextResponse } from 'next/server';
import { updateCampusStudent, type StudentStatus } from '@/lib/bibleStudies';
import { updateContact } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

const STATUSES: StudentStatus[] = ['active', 'dormant', 'graduated', 'transferred', 'left_school'];

// PATCH /api/iowa/admin/students/:contactId
//
// Two records, one call. Campus facts (year, status, notes) go to
// campus_students; name, phone and email are the PERSON, so they're written
// straight to contacts — editing a student here updates them everywhere,
// because there is only one copy.
//
// Deliberately narrow on the contact side: the campus admin can fix contact
// details, but not touch newsletter subscription, tags, or archive someone.
// Those belong to the main contacts admin, behind its own password.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    year?: string | null;
    status?: StudentStatus;
    notes?: string | null;
    name?: string;
    phone?: string | null;
    email?: string | null;
  };

  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Unknown student status.' }, { status: 400 });
  }
  if ('name' in body && !body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (body.email?.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email.trim())) {
    return NextResponse.json({ error: 'That email address looks wrong.' }, { status: 400 });
  }

  try {
    const campus: { year?: string | null; status?: StudentStatus; notes?: string | null } = {};
    if ('year' in body) campus.year = body.year;
    if ('status' in body) campus.status = body.status;
    if ('notes' in body) campus.notes = body.notes;
    if (Object.keys(campus).length) await updateCampusStudent(id, campus);

    const person: { name?: string; phone?: string | null; email?: string | null } = {};
    if ('name' in body) person.name = body.name!.trim();
    if ('phone' in body) person.phone = body.phone?.trim() || null;
    if ('email' in body) person.email = body.email?.trim() || null;
    const contact = Object.keys(person).length ? await updateContact(id, person) : null;

    return NextResponse.json({ ok: true, contact });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
