'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { parseVideoLink } from '@/lib/videoLinks';
import type { Post, MediaItem } from '@/lib/feed';

/**
 * Latest ARK Update preview — the newest published Ministry Feed post, shown
 * inline on the Resources page: lead photo (or video thumbnail with a play
 * badge), headline, and the first paragraph only. "View full update" opens the
 * post; the whole body never renders here.
 *
 * Reads via the anon key exactly like the public /feed — RLS (posts_public_read)
 * already restricts anon to status = 'published'. If the fetch fails or there
 * are no published posts, the card falls back to the plain buttons-only layout,
 * identical to what shipped before this preview existed.
 */

/** First non-empty paragraph of the post body, or null. */
function firstParagraph(post: Post): string | null {
  const body = (post.final_text || post.draft_text || '').replace(/\r\n/g, '\n');
  const para = body.split(/\n\s*\n/).map((p) => p.trim()).find(Boolean);
  return para || null;
}

/** Lead photo URL for the post (multi-item media list, then legacy columns). */
function leadPhoto(post: Post): string | null {
  const photo = (post.media ?? []).find((m) => m.type === 'photo');
  if (photo) return photo.url;
  if (post.media_type === 'photo') return post.display_media_url || post.raw_media_url;
  return null;
}

/** First video item on the post, or null. */
function leadVideo(post: Post): MediaItem | null {
  const vid = (post.media ?? []).find((m) => m.type === 'video');
  if (vid) return vid;
  if (post.media_type === 'video' && (post.display_media_url || post.raw_media_url)) {
    return { url: (post.display_media_url || post.raw_media_url) as string, type: 'video' };
  }
  return null;
}

/**
 * Thumbnail image for the card and whether it represents a video.
 * YouTube links resolve to their poster frame; everything else uses the lead
 * photo (a Vimeo or uploaded video with no photo shows the play tile alone).
 */
function cardMedia(post: Post): { thumb: string | null; isVideo: boolean } {
  const video = leadVideo(post);
  const photo = leadPhoto(post);
  if (video) {
    const parsed = video.provider ? parseVideoLink(video.url) : null;
    if (parsed?.provider === 'youtube') {
      return { thumb: `https://img.youtube.com/vi/${parsed.id}/hqdefault.jpg`, isVideo: true };
    }
    return { thumb: photo, isVideo: true };
  }
  return { thumb: photo, isVideo: false };
}

export default function LatestUpdatePreview() {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && !error && data) setPost(data as Post);
      } catch {
        /* leave null — the card renders its buttons-only fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const para = post ? firstParagraph(post) : null;
  const { thumb, isVideo } = post ? cardMedia(post) : { thumb: null, isVideo: false };

  return (
    <section>
      <div className="resources-section-card">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(232,181,98,0.15)' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ark-gold)"
              strokeWidth="1.5"
              className="w-5 h-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ARK Updates</h2>
            <p className="text-white/50 text-sm">Stories &amp; photos from the field</p>
          </div>
        </div>

        {post && (
          <Link href={`/feed/${post.id}`} className="block mb-4 rounded-xl overflow-hidden">
            {thumb && (
              <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="flex items-center justify-center w-14 h-14 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.55)' }}
                    >
                      <svg viewBox="0 0 24 24" fill="#fff" className="w-6 h-6 ml-0.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
            )}
            {isVideo && !thumb && (
              <div
                className="w-full flex items-center justify-center"
                style={{ aspectRatio: '16 / 9', background: 'rgba(255,255,255,0.06)' }}
              >
                <span
                  className="flex items-center justify-center w-14 h-14 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  <svg viewBox="0 0 24 24" fill="#fff" className="w-6 h-6 ml-0.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
            )}

            <div className={thumb || isVideo ? 'pt-3' : ''}>
              {post.headline && (
                <h3 className="text-white font-bold text-base leading-snug mb-1">
                  {post.headline}
                </h3>
              )}
              {para && (
                <p
                  className="text-white/60 text-sm leading-relaxed"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {para}
                </p>
              )}
            </div>
          </Link>
        )}

        <div className="flex flex-wrap gap-2">
          <Link href={post ? `/feed/${post.id}` : '/feed'} className="resources-btn-gold-sm">
            {post ? 'View full update' : 'View updates'}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-3.5 h-3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
          {post && (
            <Link
              href="/feed"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ border: '1px solid rgba(232,181,98,0.5)', color: 'var(--ark-gold)' }}
            >
              All updates
            </Link>
          )}
          <Link
            href="/feed/subscribe"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ border: '1px solid rgba(232,181,98,0.5)', color: 'var(--ark-gold)' }}
          >
            Get updates
          </Link>
        </div>
      </div>
    </section>
  );
}
