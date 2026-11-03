import { listOrders } from '@/lib/store';
import { OrderList } from '@/components/store/OrderList';

export const metadata = { title: 'Orders - ARK Identity' };
export const dynamic = 'force-dynamic';

// Every store order from every front door (creedcards.com now). Webhook: /api/store/stripe-webhook.
export default async function OrdersAdminPage() {
  const orders = await listOrders().catch(() => []);
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-2 gap-3">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            Orders
          </h1>
          {/* A file download, not a page: plain <a> on purpose */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/admin/orders/export"
            className="text-sm font-semibold rounded-lg px-4 py-2 text-white shrink-0"
            style={{ background: 'var(--navy)' }}
          >
            Pirate Ship CSV
          </a>
        </div>
        <p className="mb-8" style={{ color: '#8a8378' }}>
          Paid orders from Stripe, oldest first. Pack, then ship with the tracking number (that emails the buyer). The
          CSV has every order not shipped yet.
        </p>
        <OrderList initial={orders} />
      </div>
    </div>
  );
}
