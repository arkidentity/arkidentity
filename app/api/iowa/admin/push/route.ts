import { NextResponse } from 'next/server';
import { currentStaff } from '@/lib/iowaStaff';
import { deviceCount, pushConfigured, pushToStaff, removeSubscription, saveSubscription } from '@/lib/push';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/push
//   { subscription }  — this device wants notifications
//   { test: true }    — send one to my devices, so I can see it works
// DELETE /api/iowa/admin/push  { endpoint } — this device is opting out
export async function POST(req: Request) {
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  if (!pushConfigured()) {
    return NextResponse.json({ error: 'Push isn’t set up on the server yet (VAPID keys).' }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    subscription?: { endpoint: string; keys: { p256dh: string; auth: string } };
    test?: boolean;
  };
  try {
    if (body.test) {
      const sent = await pushToStaff([me.id], {
        title: 'ARK Iowa',
        body: 'Notifications are on. This is what they look like.',
        url: '/iowa/admin',
        tag: 'test',
      });
      return NextResponse.json({ sent });
    }
    if (!body.subscription) return NextResponse.json({ error: 'No subscription sent.' }, { status: 400 });
    await saveSubscription(me.id, body.subscription, req.headers.get('user-agent'));
    return NextResponse.json({ ok: true, devices: await deviceCount(me.id) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!endpoint) return NextResponse.json({ error: 'Which device?' }, { status: 400 });
  try {
    await removeSubscription(endpoint);
    return NextResponse.json({ ok: true, devices: await deviceCount(me.id) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
