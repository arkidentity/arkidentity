import type { Metadata, Viewport } from 'next';
import { Anton } from 'next/font/google';
import OutreachDebriefForm from '@/components/iowa/OutreachDebriefForm';

const display = Anton({ weight: '400', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Trick or Truth debrief — ARK Iowa',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#0A0A0B' };

// Texted to volunteers each evening. Two minutes, phone-first.
export default function DebriefPage() {
  return (
    <div style={{ background: '#0A0A0B', color: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#FF5A1F' }}>
          Trick or Truth · Debrief
        </p>
        <h1 className={`${display.className} mt-3 text-4xl uppercase leading-tight`}>What did God do tonight?</h1>
        <p className="mt-3 mb-8" style={{ color: '#c9c9cf' }}>
          Two minutes. Rough numbers are fine. The stories matter most.
        </p>
        <OutreachDebriefForm />
      </div>
    </div>
  );
}
