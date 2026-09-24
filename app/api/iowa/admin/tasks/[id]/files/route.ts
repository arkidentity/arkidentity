import { NextResponse } from 'next/server';
import { currentStaff } from '@/lib/iowaStaff';
import { MAX_FILE_MB, recordFile, signUpload } from '@/lib/taskFiles';
import { notifyTaskFile } from '@/lib/taskNotify';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/tasks/:id/files
//   { sign: { filename } }                       — where to upload it
//   { name, path, contentType?, size? }          — it landed; index it
//
// Anyone signed in can attach to a task they can see; a student leader is
// already limited to their own tasks by the PATCH guard, and files here are
// chord charts and forms, not records worth walling off.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    sign?: { filename?: string };
    name?: string;
    path?: string;
    contentType?: string;
    size?: number;
  };

  try {
    if (body.sign) {
      const filename = body.sign.filename?.trim();
      if (!filename) return NextResponse.json({ error: 'What file?' }, { status: 400 });
      return NextResponse.json(await signUpload(id, filename));
    }
    if (!body.name || !body.path) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });
    if (body.size && body.size > MAX_FILE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Files need to be under ${MAX_FILE_MB}MB.` }, { status: 400 });
    }
    const file = await recordFile(
      id,
      { name: body.name, path: body.path, contentType: body.contentType, size: body.size },
      me
    );
    await notifyTaskFile(id, file.name, me);
    return NextResponse.json({ file });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
