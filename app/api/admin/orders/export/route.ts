import { listOrders, pirateShipCsv } from '@/lib/store';

export const dynamic = 'force-dynamic';

// GET /api/admin/orders/export — Pirate Ship CSV of every order not yet shipped (paid + packed).
export async function GET() {
  const orders = (await listOrders()).filter((o) => o.status === 'paid' || o.status === 'packed');
  const day = new Date().toISOString().slice(0, 10);
  return new Response(pirateShipCsv(orders), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="orders-${day}.csv"` },
  });
}
