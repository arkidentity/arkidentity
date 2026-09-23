import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { addMember } from '@/lib/bibleStudies';
import { queueStudySync } from '@/lib/calendarSync';
import { queueSeated } from '@/lib/campusAutomation';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/members — Travis adds a student to a study by hand.
export async function POST(req: Request) {
  const me = await requirePermission('viewAllStudies');
  if (me instanceof NextResponse) return me;
  const body = (await req.json().catch(() => ({}))) as {
    studyId?: string;
    name?: string;
    phone?: string;
    email?: string;
    year?: string;
    source?: string;
    notes?: string;
    metBy?: string;
  };

  if (!body.studyId?.trim()) return bad('Missing study.');
  if (!body.name?.trim()) return bad('Name is required.');
  if (!body.phone?.trim() || body.phone.replace(/\D/g, '').length < 10) return bad('A textable phone is required.');
  if (!body.email?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) return bad('A valid email is required.');

  try {
    const member = await addMember(body.studyId.trim(), {
      name: body.name,
      phone: body.phone,
      email: body.email,
      year: body.year,
      source: body.source,
      notes: body.notes,
      metBy: body.metBy,
    });
    queueStudySync(member.study_id);
    queueSeated(member.id);
    return NextResponse.json({ member }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
