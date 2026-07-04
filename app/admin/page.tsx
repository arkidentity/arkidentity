import { getAllPosts } from '@/lib/feedAdmin';
import { AdminQueue } from '@/components/feed/AdminQueue';

export const metadata = { title: 'Feed Admin - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const posts = await getAllPosts();
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            Ministry Feed Admin
          </h1>
          <div className="flex items-center gap-4">
            <a href="/admin/partners" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
              Partners →
            </a>
            <a href="/feed" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
              View public feed →
            </a>
          </div>
        </div>
        <AdminQueue initialPosts={posts} />
      </div>
    </div>
  );
}
