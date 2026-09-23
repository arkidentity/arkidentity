import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { createSemester, updateSemester } from '@/lib/semesters';
import { isValidDate } from '@/lib/campusFormat';
import { queueAllStudiesSync } from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';

interface Body {
  name?: string;
  starts_on?: string;
  ends_on?: string;
  signup_opens?: string;
  note?: string | null;
}

function dates(b: Body, all: boolean): string | null {
  for (const k of ['starts_on', 'ends_on', 'signup_opens'] as const) {
    if ((all || b[k] !== undefined) && !isValidDate(b[k])) return 'Every date needs to be filled in.';
  }
  if (b.starts_on && b.ends_on && b.ends_on <= b.starts_on) return 'The semester ends before it starts.';
  return null;
}

// POST /api/iowa/admin/semesters — add a semester (e.g. Spring 2028).
export async function POST(req: Request) {
  const me = await requirePermission('manageSettings');
  if (me instanceof NextResponse) return me;
  const b = (await req.json().catch(() => ({}))) as Body;
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name it, like “Spring 2028”.' }, { status: 400 });
  const bad = dates(b, true);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  try {
    await createSemester({ name: b.name.trim(), starts_on: b.starts_on!, ends_on: b.ends_on!, signup_opens: b.signup_opens!, note: b.note?.trim() || null });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// PATCH /api/iowa/admin/semesters — { name, starts_on?, ends_on?, signup_opens?, note? }
// Dates move which weeks studies meet, so Google is re-synced.
export async function PATCH(req: Request) {
  const me = await requirePermission('manageSettings');
  if (me instanceof NextResponse) return me;
  const b = (await req.json().catch(() => ({}))) as Body;
  if (!b.name) return NextResponse.json({ error: 'Which semester?' }, { status: 400 });
  const bad = dates(b, false);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  try {
    const { name, ...patch } = b;
    await updateSemester(name, patch);
    queueAllStudiesSync();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
