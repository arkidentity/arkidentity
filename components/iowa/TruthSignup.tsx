'use client';

import { useState } from 'react';
import SlotGrid from '@/components/iowa/SlotGrid';
import { InterestForm } from '@/components/iowa/StudiesBrowser';

export default function TruthSignup() {
  const [cells, setCells] = useState<Set<string>>(new Set());

  function toggleCell(day: number, block: string) {
    const key = `${day}-${block}`;
    setCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="block text-sm font-semibold mb-3" style={{ color: 'var(--navy)' }}>
          When are you free?
        </span>
        <SlotGrid cells={cells} onToggle={toggleCell} />
      </div>
      <InterestForm freeSlots={[...cells]} source="Trick or Truth" submitLabel="Count me in" typedMetBy />
    </div>
  );
}
