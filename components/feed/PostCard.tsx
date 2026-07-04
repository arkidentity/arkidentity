import type { Post, MediaItem } from '@/lib/feed';
import { parseVideoLink } from '@/lib/videoLinks';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function MediaBlock({ item }: { item: MediaItem }) {
  // Embedded YouTube/Vimeo link → responsive iframe player.
  if (item.provider) {
    const parsed = parseVideoLink(item.url);
    if (parsed) {
      return (
        <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={parsed.embedUrl}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }
  if (item.type === 'video') {
    return <video controls preload="metadata" className="w-full rounded-lg bg-black" src={item.url} />;
  }
  if (item.type === 'audio') {
    return <audio controls preload="metadata" className="w-full" src={item.url} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.url} alt="" className="w-full rounded-lg object-cover" loading="lazy" />;
}

function PostGallery({ post }: { post: Post }) {
  // Prefer the multi-item media list; fall back to the legacy single-media
  // columns for seed rows.
  const items: MediaItem[] =
    post.media && post.media.length > 0
      ? post.media
      : post.display_media_url || post.raw_media_url
        ? [{ url: (post.display_media_url || post.raw_media_url)!, type: post.media_type ?? 'photo' }]
        : [];

  if (items.length === 0) return null;

  return (
    <div className={`mb-5 grid gap-3 ${items.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
      {items.map((item, i) => (
        <MediaBlock key={i} item={item} />
      ))}
    </div>
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

      <PostGallery post={post} />

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
