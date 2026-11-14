import type { Metadata } from 'next';
import ColorsMock from './ColorsMock';

// Lab: three ways to use navy on the Today screen. Sample data; nothing saves.
export const metadata: Metadata = { title: 'ARK Iowa — colors (lab)', robots: { index: false } };

export default function Page() {
  return <ColorsMock />;
}
