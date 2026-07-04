import { NextResponse } from 'next/server';
import { updatePartner, deletePartner, type Partner } from '@/lib/partners';

// PATCH /api/admin/partners/:id — edit fields (name/email/phone/channel/
// frequency/active).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Partial<
    Pick<Partner, 'name' | 'email' | 'phone' | 'channel' | 'frequency' | 'active'>
  >;
  try {
    const partner = await updatePartner(id, body);
    return NextResponse.json({ partner });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// DELETE /api/admin/partners/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deletePartner(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
