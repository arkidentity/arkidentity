import type { Metadata } from 'next';
import LookMock from './LookMock';

// Lab: one look for the whole admin (navy frame, cream lists, gold = act). Sample data; nothing saves.
export const metadata: Metadata = { title: 'ARK Iowa — look (lab)', robots: { index: false } };

export default function Page() {
  return <LookMock />;
}
