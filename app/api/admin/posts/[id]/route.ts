import { NextResponse } from 'next/server';
import { editPost, updatePost, approvePost, publishPost, draftPost, deletePost } from '@/lib/feedAdmin';
import type { MediaItem, MediaType } from '@/lib/feed';

const VALID_TYPES: MediaType[] = ['photo', 'video', 'audio'];

function cleanMedia(media: unknown): MediaItem[] {
  if (!Array.isArray(media)) return [];
  return (media as MediaItem[])
    .filter((m) => m && typeof m.url === 'string' && VALID_TYPES.includes(m.type))
    .map((m) => ({
      url: m.url,
      type: m.type,
      ...(m.provider === 'youtube' || m.provider === 'vimeo' ? { provider: m.provider } : {}),
    }));
}

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
    action?: 'draft' | 'edit' | 'update' | 'approve' | 'publish';
    final_text?: string;
    headline?: string;
    media?: MediaItem[];
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
      case 'update':
        post = await updatePost(id, {
          ...(body.final_text !== undefined ? { final_text: body.final_text.trim() } : {}),
          ...(body.headline !== undefined ? { headline: body.headline.trim() } : {}),
          ...(body.media !== undefined ? { media: cleanMedia(body.media) } : {}),
        });
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
