import type { Metadata } from 'next';
import TodayMock from './TodayMock';

// Lab: a mock of a simpler ARK Iowa admin home ("Today") with a bottom tab bar.
// Sample data only (made-up names) — nothing here reads or writes the database.
export const metadata: Metadata = { title: 'ARK Iowa — Today (lab)', robots: { index: false } };

export default function Page() {
  return <TodayMock />;
}
