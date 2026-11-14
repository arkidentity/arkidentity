import type { Metadata } from 'next';
import StudiesMock from './StudiesMock';

// Lab: the Studies tab for the phone admin. Sample data only; nothing saves.
export const metadata: Metadata = { title: 'ARK Iowa — Studies (lab)', robots: { index: false } };

export default function Page() {
  return <StudiesMock />;
}
