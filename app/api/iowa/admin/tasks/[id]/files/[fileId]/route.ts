import { NextResponse } from 'next/server';
import { currentStaff } from '@/lib/iowaStaff';
import { deleteFile, signDownload } from '@/lib/taskFiles';

export const dynamic = 'force-dynamic';

// GET — redirect to a one-minute signed URL for the file (the bucket is
// private, so this is how anyone opens it).
export async function GET(_req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  if (!(await currentStaff())) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  try {
    const signed = await signDownload(fileId);
    if (!signed) return NextResponse.json({ error: 'That file is gone.' }, { status: 404 });
    return NextResponse.redirect(signed.url);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  if (!(await currentStaff())) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  try {
    await deleteFile(fileId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
