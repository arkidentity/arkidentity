import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { ensureStudentContact } from '@/lib/bibleStudies';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/students   { name, phone, email?, year?, metBy? }
// Add a student straight from the Students page, no study required. Same
// person-matching as every other door (email, then phone), so re-adding
// someone who's already here fills blanks instead of duplicating them.
// Email is optional — a phone number is enough to reach a student.
export async function POST(req: Request) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    email?: string;
    year?: string;
    metBy?: string;
  };

  if (!body.name?.trim()) return bad('Name is required.');
  if (!body.phone?.trim() || body.phone.replace(/\D/g, '').length < 10) return bad('A textable phone is required.');
  if (body.email?.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email.trim())) {
    return bad('That email address looks wrong.');
  }

  try {
    const contact = await ensureStudentContact({
      name: body.name,
      phone: body.phone,
      email: body.email,
      year: body.year,
      metBy: body.metBy,
    });
    return NextResponse.json({ contactId: contact.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
