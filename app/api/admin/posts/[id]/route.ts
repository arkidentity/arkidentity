import { NextResponse } from 'next/server';
import { editPost, approvePost, publishPost } from '@/lib/feedAdmin';

// PATCH /api/admin/posts/:id — advance a post through the pipeline.
// body: { action: 'edit' | 'approve' | 'publish', final_text?: string }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: 'edit' | 'approve' | 'publish';
    final_text?: string;
  };

  try {
    let post;
    switch (body.action) {
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
