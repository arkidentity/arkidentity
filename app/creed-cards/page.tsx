'use client';

export default function CreedCardsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--primary-color)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Creed Cards</h1>
        <p className="text-white/60 text-sm">Memorize core truths of the Christian faith.</p>
      </div>

      <div className="px-5">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-white/60 text-sm">Creed Cards content will be migrated from the current ARK app.</p>
          <p className="text-white/40 text-xs mt-2">50 cards covering essential Christian creeds and beliefs.</p>
        </div>
      </div>
    </div>
  );
}
