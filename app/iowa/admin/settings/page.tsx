import type { Metadata } from 'next';
import { listTypes } from '@/lib/campusTasks';
import TypeSettings from '@/components/iowa/campus/TypeSettings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — settings' };

export default async function IowaSettingsPage() {
  return <TypeSettings types={await listTypes()} />;
}
