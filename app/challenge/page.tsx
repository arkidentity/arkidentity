'use client';

export default function ChallengePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--primary-color)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">3D Bible Challenge</h1>
        <p className="text-white/60 text-sm">Build a daily journal habit with streaks, badges, and milestones.</p>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {[
          { days: 7, label: 'Starter', color: '#143348', desc: 'Build the foundation' },
          { days: 21, label: 'Habit Builder', color: '#5f0c0b', desc: 'Form a lasting habit', recommended: true },
          { days: 50, label: 'Warrior', color: '#e8b562', desc: 'Deep commitment' },
          { days: 100, label: 'Legend', color: '#1E90FF', desc: 'Unstoppable consistency' },
          { days: 365, label: 'Legacy', color: '#15803d', desc: 'A year of faithfulness' },
        ].map((tier) => (
          <div
            key={tier.days}
            className="rounded-2xl p-5 relative"
            style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)`, border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {tier.recommended && (
              <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-color)', color: '#143348' }}>
                RECOMMENDED
              </span>
            )}
            <h2 className="text-lg font-bold text-white">{tier.days}-Day {tier.label}</h2>
            <p className="text-white/70 text-sm mt-1">{tier.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
