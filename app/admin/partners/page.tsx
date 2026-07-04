import { listPartners } from '@/lib/partners';
import { PartnerManager } from '@/components/feed/PartnerManager';

export const metadata = { title: 'Partners - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
  const partners = await listPartners();
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>Partners</h1>
          <a href="/admin" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
            ← Back to updates
          </a>
        </div>
        <PartnerManager initialPartners={partners} />
      </div>
    </div>
  );
}
