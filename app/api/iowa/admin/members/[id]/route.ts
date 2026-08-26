import { NextResponse } from 'next/server';
import { setMemberStatus } from '@/lib/bibleStudies';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/members/:id — mark a member `dropped` (frees a seat,
// keeps history) or `active` again.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (body.status !== 'active' && body.status !== 'dropped') {
    return NextResponse.json({ error: 'status must be active or dropped.' }, { status: 400 });
  }
  try {
    const member = await setMemberStatus(id, body.status);
    return NextResponse.json({ member });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
