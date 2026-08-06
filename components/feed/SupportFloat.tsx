import Link from 'next/link';

// Small, always-visible giving pill for the feed pages. Sits above the bottom
// tab bar (which renders on /feed) and clears the mobile safe area.
export function SupportFloat() {
  return (
    <Link
      href="/giving"
      className="fixed right-4 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm shadow-lg transition hover:opacity-90"
      style={{
        bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--gold)',
        color: 'var(--navy)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
      }}
      aria-label="Support the mission"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }} aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      Support the mission
    </Link>
  );
}
