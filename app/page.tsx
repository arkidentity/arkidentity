'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--primary-color)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/" className="app-header-logo">
            <Image
              src="/images/ark-logo-web.png"
              alt="ARK Identity"
              width={160}
              height={32}
              priority
              className="app-header-logo-img"
            />
          </Link>
        </div>
      </header>

      {/* Course Library placeholder — will be replaced by submodule import */}
      <div className="px-5 pt-4">
        <h2 className="text-xl font-bold text-white mb-2">ARK Courses</h2>
        <p className="text-white/60 text-sm mb-6">Identity-focused discipleship courses</p>

        <div className="text-center py-12 text-white/40">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto mb-4 opacity-40">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8" />
            <path d="M8 11h6" />
          </svg>
          <p className="text-sm">Courses will load once the ark-courses submodule is mounted.</p>
          <p className="text-xs mt-2 text-white/30">Run: git submodule add &lt;repo&gt; shared/ark-courses</p>
        </div>
      </div>
    </div>
  );
}
