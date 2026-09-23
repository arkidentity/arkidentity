import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { applyTemplate } from '@/lib/eventChecklists';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/events/:id/checklist — { templateId: string | null }
// Apply a checklist template to the event (tasks made now, or per occurrence
// for a repeating event), or clear it.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('manageEvents');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const { templateId } = (await req.json().catch(() => ({}))) as { templateId?: string | null };
  try {
    return NextResponse.json({ made: await applyTemplate(id, templateId || null) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
