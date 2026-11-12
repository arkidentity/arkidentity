'use client';

import { BulkPicker } from '../_shop/BulkPicker';

// Bulk bonuses match lib/store.ts bulkBonus: 1 free deck per 10, a group guide, free DNA Journals 1 / 2 at 25+ / 3 at 50+.
const journals = (n: number) => (n >= 50 ? 3 : n >= 25 ? 2 : 1);

export function CcBulk() {
  return (
    <BulkPicker
      sku="cc-bulk"
      title="Bulk: 10 decks or more"
      noun={['deck', 'decks']}
      lead="Every bulk order comes with a group guide for your leaders."
      extras={(n) => {
        const free = Math.floor(n / 10);
        const j = journals(n);
        return [`${free} free ${free === 1 ? 'deck' : 'decks'} (${n + free} total)`, `${j} free DNA ${j === 1 ? 'Journal' : 'Journals'}`];
      }}
      nudge={(n) => {
        const toDeck = 10 - (n % 10);
        const toJournal = n < 25 ? 25 - n : n < 50 ? 50 - n : 0;
        if (toJournal && toJournal <= toDeck) return `${toJournal} more ${toJournal === 1 ? 'deck adds' : 'decks add'} another free Journal.`;
        return `${toDeck} more ${toDeck === 1 ? 'deck adds' : 'decks add'} another free deck.`;
      }}
    />
  );
}
