import { getAllPosts } from '@/lib/feedAdmin';
import { AdminQueue } from '@/components/feed/AdminQueue';

export const metadata = { title: 'Updates - ARK Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const posts = await getAllPosts();
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--navy)' }}>
          Updates
        </h1>
        <AdminQueue initialPosts={posts} />
      </div>
    </div>
  );
}
