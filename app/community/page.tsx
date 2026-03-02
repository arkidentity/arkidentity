'use client';

import { useState } from 'react';

type Tab = 'feed' | 'ark-online';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  return (
    <div className="min-h-screen" style={{ background: 'var(--primary-color)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-white mb-4">Community</h1>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'feed'
                ? 'text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
            style={activeTab === 'feed' ? { background: 'var(--accent-color)' } : { background: 'rgba(255,255,255,0.1)' }}
          >
            Community Feed
          </button>
          <button
            onClick={() => setActiveTab('ark-online')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'ark-online'
                ? 'text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
            style={activeTab === 'ark-online' ? { background: 'var(--accent-color)' } : { background: 'rgba(255,255,255,0.1)' }}
          >
            ARK Online
          </button>
        </div>
      </div>

      {activeTab === 'feed' && (
        <div className="px-5">
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-white/60 text-sm">Community feed coming soon.</p>
            <p className="text-white/40 text-xs mt-2">Share journal entries and prayer reflections with the ARK community.</p>
          </div>
        </div>
      )}

      {activeTab === 'ark-online' && (
        <div className="px-5">
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-white/60 text-sm">ARK Online events coming soon.</p>
            <p className="text-white/40 text-xs mt-2">Live events, schedules, and RSVP.</p>
          </div>
        </div>
      )}
    </div>
  );
}
