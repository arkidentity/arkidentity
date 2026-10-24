import { NextResponse } from 'next/server';
import { removeOutreachSignup } from '@/lib/outreach';
import { currentStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// DELETE /api/iowa/admin/outreach-signup?id= — staff only (Trick or Truth admin: test sign-ups, drop-outs)
export async function DELETE(req: Request) {
  if (!(await currentStaff())) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Which one?' }, { status: 400 });
  try {
    await removeOutreachSignup(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
