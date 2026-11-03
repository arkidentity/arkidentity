import { NextResponse } from 'next/server';
import { renameTag, deleteTag, mergeTags } from '@/lib/contacts';
import { deleteGoogleGroup, googleGroupForTag, renameGoogleGroup } from '@/lib/googleContacts';

// Google label changes are best-effort: the ARK change stands either way, and
// the response says so if Google didn't follow.
async function google(step: () => Promise<void>): Promise<string | undefined> {
  try {
    await step();
  } catch (e) {
    return `Saved in ARK, but the Google label wasn't updated: ${(e as Error).message}`;
  }
}

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
      const group = await googleGroupForTag(id);
      await mergeTags(id, body.mergeIntoId);
      const googleError = await google(() => deleteGoogleGroup(group));
      return NextResponse.json({ ok: true, merged: true, googleError });
    }
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Give the tag a name.' }, { status: 400 });
    }
    const tag = await renameTag(id, body.name, body.category);
    const googleError = await google(async () => renameGoogleGroup(await googleGroupForTag(id), tag.name));
    return NextResponse.json({ tag, googleError });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/admin/contacts/tags/:id — removes the tag from every contact it
// was on (the links cascade). The contacts themselves are untouched.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const group = await googleGroupForTag(id);
    await deleteTag(id);
    const googleError = await google(() => deleteGoogleGroup(group));
    return NextResponse.json({ ok: true, googleError });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
