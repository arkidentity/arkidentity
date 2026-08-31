import { NextResponse } from 'next/server';
import { renameTag, deleteTag, mergeTags } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/contacts/tags/:id
//   { name, category }  → rename
//   { mergeIntoId }     → move every contact onto that tag, then drop this one
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    category?: string;
    mergeIntoId?: string;
  };

  try {
    if (body.mergeIntoId) {
      await mergeTags(id, body.mergeIntoId);
      return NextResponse.json({ ok: true, merged: true });
    }
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Give the tag a name.' }, { status: 400 });
    }
    const tag = await renameTag(id, body.name, body.category);
    return NextResponse.json({ tag });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/admin/contacts/tags/:id — removes the tag from every contact it
// was on (the links cascade). The contacts themselves are untouched.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteTag(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
