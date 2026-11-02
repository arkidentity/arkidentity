import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedPost, postExcerpt, postLeadImage } from '@/lib/feed';
import { PostCard } from '@/components/feed/PostCard';
import { SupportFloat } from '@/components/feed/SupportFloat';

export const dynamic = 'force-dynamic';

// Per-post Open Graph tags so a texted/shared link previews with THIS post's
// headline, excerpt, and lead photo.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublishedPost(id);
  if (!post) return { title: 'Ministry Feed - ARK Identity' };

  const title = post.headline || 'ARK Identity ministry update';
  const description = postExcerpt(post) || 'Updates from the field.';
  const image = postLeadImage(post);

  return {
    title: `${title} - ARK Identity`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/feed/${post.id}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPublishedPost(id);
  if (!post) notFound();

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <a href="/feed" className="inline-block mb-6 text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
            ← All updates
          </a>
          <PostCard post={post} />
          <div className="text-center mt-4">
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
