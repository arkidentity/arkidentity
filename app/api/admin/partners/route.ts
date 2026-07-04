import { NextResponse } from 'next/server';
import { createPartner, type PartnerChannel, type PartnerFrequency } from '@/lib/partners';

// POST /api/admin/partners — add a trusted partner (confirmed immediately).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    phone?: string;
    channel?: PartnerChannel;
    frequency?: PartnerFrequency;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!body.email?.trim() && !body.phone?.trim()) {
    return NextResponse.json({ error: 'Add an email or a phone number.' }, { status: 400 });
  }

  try {
    const partner = await createPartner({
      name: body.name,
      email: body.email,
      phone: body.phone,
      channel: body.channel,
      frequency: body.frequency,
    });
    return NextResponse.json({ partner }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
