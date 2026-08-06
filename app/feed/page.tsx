import type { Metadata } from 'next';
import { getPublishedPosts, postLeadImage } from '@/lib/feed';
import { PostCard } from '@/components/feed/PostCard';
import { SupportFloat } from '@/components/feed/SupportFloat';

const FEED_TITLE = 'Ministry Feed - ARK Identity';
const FEED_DESC = 'Updates from the field — photos, stories, and moments from ARK Identity ministry.';

// Preview the feed link with the most recent post's photo.
export async function generateMetadata(): Promise<Metadata> {
  const posts = await getPublishedPosts();
  const image = posts.map(postLeadImage).find(Boolean) || null;
  return {
    title: FEED_TITLE,
    description: FEED_DESC,
    openGraph: {
      title: FEED_TITLE,
      description: FEED_DESC,
      url: '/feed',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: FEED_TITLE,
      description: FEED_DESC,
      images: image ? [image] : undefined,
    },
  };
}

// Always render fresh so newly published posts appear without a rebuild.
export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const posts = await getPublishedPosts();

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      {/* Hero */}
      <section className="py-16" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>
            From the Field
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ministry Feed</h1>
          <p className="text-xl text-gray-300">
            Stories, photos, and moments from the work God is doing.
          </p>
          <div
            className="w-16 h-1 mx-auto mt-8 rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--gold), transparent)' }}
          />
        </div>
      </section>

      {/* Feed */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <p className="text-center text-lg" style={{ color: '#5a5247' }}>
              No updates yet — check back soon.
            </p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}

          <div className="text-center mt-8">
            <a
              href="/feed/subscribe"
              className="inline-block px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              Get these updates by email
            </a>
          </div>
        </div>
      </section>

      <SupportFloat />
    </div>
  );
}
