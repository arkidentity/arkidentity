import { NextResponse } from 'next/server';
import { editPost, approvePost, publishPost, draftPost, deletePost } from '@/lib/feedAdmin';

// AI drafting calls Claude, which can run longer than the default limit.
export const maxDuration = 60;

// PATCH /api/admin/posts/:id — advance a post through the pipeline.
// body: { action: 'draft' | 'edit' | 'approve' | 'publish', final_text?: string }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: 'draft' | 'edit' | 'approve' | 'publish';
    final_text?: string;
  };

  try {
    let post;
    switch (body.action) {
      case 'draft':
        post = await draftPost(id);
        break;
      case 'edit':
        if (!body.final_text?.trim()) {
          return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
        }
        post = await editPost(id, body.final_text.trim());
        break;
      case 'approve':
        post = await approvePost(id, body.final_text?.trim());
        break;
      case 'publish':
        post = await publishPost(id);
        break;
      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
    return NextResponse.json({ post });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// DELETE /api/admin/posts/:id — permanently remove a post (any status) and its
// uploaded media.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deletePost(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
