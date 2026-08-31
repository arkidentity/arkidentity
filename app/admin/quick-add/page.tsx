import { listTags } from '@/lib/contacts';
import { QuickAdd } from '@/components/contacts/QuickAdd';

export const metadata = { title: 'Quick Add - ARK Identity' };
export const dynamic = 'force-dynamic';

// The lobby screen: someone you just met, thirty seconds, one thumb. No
// dashboard chrome on purpose — this route stays as light as it can be.
export default async function QuickAddPage() {
  const tags = await listTags();
  return <QuickAdd tags={tags} />;
}
