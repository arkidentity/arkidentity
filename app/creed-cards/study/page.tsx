import { Suspense } from 'react';
import { StudyScreen } from '@creed-cards/app/study/StudyScreen';

/**
 * Mirrors Daily DNA's study route. Suspense is required because StudyScreen
 * reads search params (?mode=daily) — without it the build fails on
 * useSearchParams during prerender.
 */
export default function Page() {
  return (
    <Suspense fallback={<div style={{ height: '100dvh', background: 'var(--primary-color)' }} />}>
      <StudyScreen />
    </Suspense>
  );
}
