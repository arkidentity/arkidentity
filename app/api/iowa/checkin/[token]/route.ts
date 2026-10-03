import { NextResponse } from 'next/server';
import { answerCheckin } from '@/lib/semesterCheckins';

export const dynamic = 'force-dynamic';

// POST /api/iowa/checkin/:token — { response: yes|no|unsure, slots: string[], note? }
// A returning student's answer from their personal link (migration 038). No
// login; the 48-hex token is the key. They can answer again to change it.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await req.json().catch(() => ({}))) as { response?: string; slots?: unknown; note?: string };
  try {
    await answerCheckin(token, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
