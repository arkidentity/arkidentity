import type { Post } from '@/lib/feed';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function PostMedia({ post }: { post: Post }) {
  const url = post.display_media_url || post.raw_media_url;
  if (!url) return null;

  if (post.media_type === 'video') {
    return (
      <video
        controls
        preload="metadata"
        className="w-full rounded-lg mb-5 bg-black"
        src={url}
      />
    );
  }
  if (post.media_type === 'audio') {
    return <audio controls preload="metadata" className="w-full mb-5" src={url} />;
  }
  // photo (default)
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={url}
      alt=""
      className="w-full rounded-lg mb-5 object-cover"
      loading="lazy"
    />
  );
}

export function PostCard({ post }: { post: Post }) {
  const body = post.final_text || post.draft_text || '';
  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <article
      className="rounded-xl p-6 sm:p-8 mb-8"
      style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <time
        className="block text-sm font-semibold tracking-widest uppercase mb-4"
        style={{ color: 'var(--gold)' }}
        dateTime={post.published_at ?? undefined}
      >
        {formatDate(post.published_at)}
      </time>

      <PostMedia post={post} />

      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-lg leading-relaxed" style={{ color: '#4a4540' }}>
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
