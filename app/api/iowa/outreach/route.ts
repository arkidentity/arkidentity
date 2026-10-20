import { NextResponse } from 'next/server';
import { addOutreachSignup, slotCounts } from '@/lib/outreach';
import { EXPERIENCE, OUTREACH_SLOTS, TRICK_OR_TRUTH, experienceLabel, slotLabel } from '@/lib/outreachFormat';
import { sendOutreachAdminAlert, sendOutreachConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET /api/iowa/outreach — how many are signed up for each slot.
export async function GET() {
  try {
    return NextResponse.json({ counts: await slotCounts(TRICK_OR_TRUTH) });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}

// POST /api/iowa/outreach — a volunteer joins the Trick or Truth outreach team.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    email?: string;
    slots?: unknown;
    bringing?: unknown;
    under18?: boolean;
    experience?: string;
    note?: string;
    hpField?: string;
  };

  if (body.hpField) return NextResponse.json({ ok: true }); // honeypot

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();
  const valid = new Set(OUTREACH_SLOTS.map((s) => s.key));
  const slots = Array.isArray(body.slots) ? [...new Set(body.slots.filter((s): s is string => typeof s === 'string' && valid.has(s)))] : [];
  const bringing = Math.max(0, Math.min(20, Math.floor(Number(body.bringing) || 0)));
  const experience = EXPERIENCE.some((e) => e.key === body.experience) ? body.experience! : null;
  const note = body.note?.trim().slice(0, 500) || null;

  if (!slots.length) return bad('Pick at least one time.');
  if (!name) return bad('Please tell us your name.');
  if (!phone || phone.replace(/\D/g, '').length < 10) return bad('Please enter a phone number we can text.');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('Please enter an email we can reach you at.');

  try {
    await addOutreachSignup({
      outreach: TRICK_OR_TRUTH,
      name,
      phone,
      email,
      slots,
      bringing,
      under_18: !!body.under18,
      experience,
      note,
    });
  } catch (e) {
    console.error('[outreach signup]', e);
    return bad('Something went wrong. Text (319) 359-7117.');
  }

  const labels = OUTREACH_SLOTS.filter((s) => slots.includes(s.key)).map((s) => slotLabel(s.key));
  await Promise.allSettled([
    sendOutreachConfirmation({ to: email, name, slots: labels }),
    sendOutreachAdminAlert({
      name,
      phone,
      email,
      slots: labels,
      bringing,
      under18: !!body.under18,
      experience: experienceLabel(experience),
      note,
    }),
  ]).then((r) => r.forEach((x) => x.status === 'rejected' && console.error('[outreach email]', x.reason)));

  return NextResponse.json({ ok: true });
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
