import type { Metadata } from 'next';
import { listStudies, CURRENT_SEMESTER } from '@/lib/bibleStudies';
import IowaAdmin from '@/components/iowa/IowaAdmin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — Bible study admin' };

export default async function IowaAdminPage() {
  const studies = await listStudies();
  return <IowaAdmin initial={studies} semester={CURRENT_SEMESTER} />;
}
