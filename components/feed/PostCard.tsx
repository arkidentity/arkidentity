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

function mediaItems(post: Post): MediaItem[] {
  // Prefer the multi-item media list; fall back to the legacy single-media
  // columns for seed rows.
  if (post.media && post.media.length > 0) return post.media;
  const legacy = post.display_media_url || post.raw_media_url;
  return legacy ? [{ url: legacy, type: post.media_type ?? 'photo' }] : [];
}

function VideoBlock({ item }: { item: MediaItem }) {
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
  if (item.type === 'audio') {
    return <audio controls preload="metadata" className="w-full" src={item.url} />;
  }
  return <video controls preload="metadata" className="w-full rounded-lg bg-black" src={item.url} />;
}

function Photo({ item, className }: { item: MediaItem; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.url} alt="" className={`rounded-lg object-cover ${className ?? ''}`} loading="lazy" />;
}

// Fallback for short updates / heavy-media posts: a simple responsive grid over
// the text.
function GalleryLayout({ items, paragraphs }: { items: MediaItem[]; paragraphs: string[] }) {
  return (
    <>
      {items.length > 0 && (
        <div className={`mb-5 grid gap-3 ${items.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {items.map((item, i) =>
            item.type === 'photo' ? <Photo key={i} item={item} className="w-full" /> : <VideoBlock key={i} item={item} />
          )}
        </div>
      )}
      <Body paragraphs={paragraphs} />
    </>
  );
}

function Body({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-lg leading-relaxed" style={{ color: '#4a4540' }}>
          {p}
        </p>
      ))}
    </div>
  );
}

// Editorial layout: lead photo, then paragraphs with the remaining photos
// floated left/right so the text wraps around them; videos full-width below.
function EditorialLayout({
  photos,
  videos,
  paragraphs,
}: {
  photos: MediaItem[];
  videos: MediaItem[];
  paragraphs: string[];
}) {
  const [lead, ...floaters] = photos;

  return (
    <>
      {lead && <Photo item={lead} className="w-full mb-5 max-h-[26rem]" />}

      <div>
        {paragraphs.map((p, i) => {
          // One floater sits before each paragraph after the first, alternating
          // sides. The guard in PostCard ensures there are enough paragraphs.
          const floater = i >= 1 ? floaters[i - 1] : undefined;
          const side = (i - 1) % 2 === 0 ? 'right' : 'left';
          return (
            <div key={i}>
              {floater && (
                <div
                  className={`w-full mb-3 sm:w-2/5 sm:mb-2 ${
                    side === 'right' ? 'sm:float-right sm:ml-5' : 'sm:float-left sm:mr-5'
                  }`}
                >
                  <Photo item={floater} className="w-full" />
                </div>
              )}
              <p className="text-lg leading-relaxed mb-4" style={{ color: '#4a4540' }}>
                {p}
              </p>
            </div>
          );
        })}
        <div className="clear-both" />
      </div>

      {videos.length > 0 && (
        <div className="space-y-4 mt-2">
          {videos.map((item, i) => (
            <VideoBlock key={i} item={item} />
          ))}
        </div>
      )}
    </>
  );
}

export function PostCard({ post }: { post: Post }) {
  const body = post.final_text || post.draft_text || '';
  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim());

  const items = mediaItems(post);
  const photos = items.filter((m) => m.type === 'photo');
  const videos = items.filter((m) => m.type !== 'photo');
  const floaterCount = Math.max(0, photos.length - 1);

  // Editorial layout needs a lead photo and enough paragraphs to wrap the
  // floated photos. Otherwise fall back to the grid so nothing looks awkward.
  const useEditorial =
    photos.length > 0 && paragraphs.length >= 2 && floaterCount <= paragraphs.length - 1;

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

      {useEditorial ? (
        <EditorialLayout photos={photos} videos={videos} paragraphs={paragraphs} />
      ) : (
        <GalleryLayout items={items} paragraphs={paragraphs} />
      )}
    </article>
  );
}
