import { NextResponse } from 'next/server';
import { markRefunded, saveCheckoutSession, tagBuyer, untagRefund, verifyStripeSignature } from '@/lib/store';

export const dynamic = 'force-dynamic';

// POST /api/store/stripe-webhook — the LLC's one Stripe webhook for every store front door.
// Stripe → Developers → Webhooks → endpoint https://www.arkidentity.com/api/store/stripe-webhook
// Events: checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded.
// Stripe's own receipt is the order confirmation; we only save the order and tag the buyer.
export async function POST(req: Request) {
  const payload = await req.text();
  if (!(await verifyStripeSignature(payload, req.headers.get('stripe-signature')))) {
    return NextResponse.json({ error: 'Bad signature.' }, { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: { id: string; payment_intent?: string | null } } };

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const order = await saveCheckoutSession(event.data.object.id);
      // A GHL hiccup never fails the webhook (Stripe would retry and the order is already saved).
      if (order) await tagBuyer(order).catch((e) => console.error('[store] GHL tag', e));
    } else if (event.type === 'charge.refunded' && event.data.object.payment_intent) {
      const refunded = await markRefunded(event.data.object.payment_intent);
      if (refunded) await untagRefund(refunded).catch((e) => console.error('[store] GHL refund', e));
    }
  } catch (e) {
    console.error('[store] webhook', event.type, e);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

