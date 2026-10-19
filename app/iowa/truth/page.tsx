import type { Metadata } from 'next';
import TruthSignup from '@/components/iowa/TruthSignup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ARK Iowa — Student Bible study',
  description: 'A student Bible study on campus. Tell us when you’re free and we’ll find a time.',
  robots: { index: false, follow: false },
};

// Trick or Truth QR target. No study picking: they tap a few free times and
// leave a number, and it lands as an interest follow-up task.
export default function TruthPage() {
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
          Student Bible study on campus
        </h1>
        <p className="text-lg text-[#4a4540] mb-8">
          One hour a week with a few other students. Tap two or more times that could work, and we’ll text you to set it up.
        </p>
        <TruthSignup />
      </div>
    </div>
  );
}
