import { Suspense } from 'react';
import { StudyScreen } from '@creed-cards/components/study/StudyScreen';

/**
 * Deck-scoped study route. Suspense is required because StudyScreen reads
 * search params — without it the build fails on useSearchParams during prerender.
 */
export default function Page() {
  return (
    <Suspense fallback={<div style={{ height: '100dvh', background: 'var(--primary-color)' }} />}>
      <StudyScreen />
    </Suspense>
  );
}
