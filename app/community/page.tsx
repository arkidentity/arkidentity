'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@supabase/supabase-js';

type FeedFilter = 'all' | 'journal' | 'prayer';

interface CommunityPost {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  scripture: string;
  scripture_passage: string | null;
  head: string | null;
  heart: string | null;
  hands: string | null;
  commitment: string | null;
  commitment_date: string | null;
  is_anonymous: boolean;
  likes_count: number;
  created_at: string;
  post_type: 'journal';
  streak?: number;
}

interface PrayerPost {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  title: string;
  content: string;
  scripture: string | null;
  post_type: 'testimony' | 'prayer_request';
  likes_count: number;
  praying_count: number;
  is_anonymous: boolean;
  created_at: string;
}

interface ArkOnlineEvent {
  id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  time: string | null;
  meeting_link: string | null;
  is_active: boolean;
}

type AnyPost = (CommunityPost | PrayerPost) & { _type: 'journal' | 'prayer' };

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Avatar({ name, url, anonymous, large }: { name: string; url?: string | null; anonymous?: boolean; large?: boolean }) {
  const size = large ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm';
  if (anonymous) {
    return <div className={`${size} rounded-full bg-gray-400 text-white flex items-center justify-center font-semibold shrink-0`}>?</div>;
  }
  if (url) {
    return (
      <div className={`${size} rounded-full overflow-hidden shrink-0 bg-[var(--ark-navy)]`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={`${size} rounded-full bg-[var(--ark-navy)] text-white flex items-center justify-center font-semibold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function PostTypeBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    journal: { bg: 'rgba(20,51,72,0.1)', color: 'var(--ark-teal)', label: 'Journal' },
    testimony: { bg: 'rgba(232,181,98,0.2)', color: '#996b1f', label: 'Testimony' },
    prayer_request: { bg: 'rgba(95,12,11,0.1)', color: 'var(--ark-maroon)', label: 'Prayer Request' },
  };
  const s = styles[type] || styles.journal;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-semibold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function StreakBadge() {
  return (
    <span className="inline-flex items-center ml-1" title="Active Challenger">
      <svg className="w-4 h-4 text-[var(--ark-gold)]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </span>
  );
}

/* ─── Journal Post Card ─── */
function JournalPostCard({ post, onOpen }: { post: CommunityPost; onOpen: () => void }) {
  const authorName = post.is_anonymous ? 'Anonymous' : (post.display_name || 'ARK Member');
  const preview = post.head || post.heart || '';
  const truncated = preview.length > 100 ? preview.slice(0, 100) + '...' : preview;

  return (
    <button className="community-post journal-post" onClick={onOpen}>
      <PostTypeBadge type="journal" />
      <div className="community-post-header">
        <div className="community-post-author">
          <Avatar name={authorName} url={post.avatar_url} anonymous={post.is_anonymous} />
          <div className="author-info">
            <span className="author-name">
              {authorName}
              {(post.streak ?? 0) >= 7 && <StreakBadge />}
            </span>
            <span className="post-time">{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>
      <div className="community-post-scripture">
        <strong>{post.scripture}</strong>
      </div>
      {truncated && (
        <div className="community-post-preview">
          <p>{truncated}</p>
        </div>
      )}
      <div className="community-post-actions">
        <span className="like-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          <span className="like-count">{post.likes_count || 0}</span>
        </span>
      </div>
    </button>
  );
}

/* ─── Prayer Post Card ─── */
function PrayerPostCard({ post, onOpen }: { post: PrayerPost; onOpen: () => void }) {
  const authorName = post.is_anonymous ? 'Anonymous' : (post.display_name || 'ARK Member');
  const truncated = post.content.length > 120 ? post.content.slice(0, 120) + '...' : post.content;

  return (
    <button className="community-post prayer-post" onClick={onOpen}>
      <PostTypeBadge type={post.post_type} />
      <div className="community-post-header">
        <div className="community-post-author">
          <Avatar name={authorName} url={post.avatar_url} anonymous={post.is_anonymous} />
          <div className="author-info">
            <span className="author-name">{authorName}</span>
            <span className="post-time">{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>
      <div className="community-post-title">
        <strong>{post.title || 'Prayer'}</strong>
      </div>
      <div className="community-post-preview">
        <p>{truncated}</p>
      </div>
      <div className="community-post-actions">
        <span className="like-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          <span className="like-count">{post.likes_count || 0}</span>
        </span>
        <span className="praying-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-5 h-5">
            <path d="M11 21H8.5C7.7 21 7 20.6 6.6 19.9L4.1 15.4C3.7 14.7 3.7 13.8 4 13.1L7.5 6C7.9 5.1 9 4.7 9.9 5.1 10.6 5.4 11 6.1 11 6.9V21Z" />
            <path d="M13 21H15.5C16.3 21 17 20.6 17.4 19.9L19.9 15.4C20.3 14.7 20.3 13.8 20 13.1L16.5 6C16.1 5.1 15 4.7 14.1 5.1 13.4 5.4 13 6.1 13 6.9V21Z" />
          </svg>
          <span className="praying-count">{post.praying_count || 0}</span>
        </span>
      </div>
    </button>
  );
}

/* ─── Journal Detail Modal ─── */
function JournalDetailModal({ post, onClose }: { post: CommunityPost; onClose: () => void }) {
  const authorName = post.is_anonymous ? 'Anonymous' : (post.display_name || 'ARK Member');
  return (
    <div className="post-detail-modal-overlay show" onClick={onClose}>
      <div className="post-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="post-detail-close" onClick={onClose}>&times;</button>
        <div className="post-detail-header">
          <div className="post-detail-author">
            <Avatar name={authorName} url={post.avatar_url} anonymous={post.is_anonymous} large />
            <div className="author-info">
              <span className="author-name">{authorName}{(post.streak ?? 0) >= 7 && <StreakBadge />}</span>
              <span className="post-time">{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="post-detail-scripture"><strong>{post.scripture}</strong></div>
        {post.scripture_passage && (
          <div className="post-detail-passage"><p>{post.scripture_passage}</p></div>
        )}
        <div className="post-detail-content">
          {post.head && (
            <div className="post-detail-section">
              <span className="section-badge head">HEAD</span>
              <p>{post.head}</p>
            </div>
          )}
          {post.heart && (
            <div className="post-detail-section">
              <span className="section-badge heart">HEART</span>
              <p>{post.heart}</p>
            </div>
          )}
          {post.hands && (
            <div className="post-detail-section">
              <span className="section-badge hands">HANDS</span>
              <p>{post.hands}</p>
            </div>
          )}
          {post.commitment && (
            <div className="post-detail-section">
              <span className="section-badge commitment">COMMITMENT</span>
              <p>{post.commitment}</p>
              {post.commitment_date && (
                <p className="commitment-date">By: {new Date(post.commitment_date).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </div>
        <div className="post-detail-actions">
          <span className="like-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            <span className="like-count">{post.likes_count || 0}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Prayer Detail Modal ─── */
function PrayerDetailModal({ post, onClose }: { post: PrayerPost; onClose: () => void }) {
  const authorName = post.is_anonymous ? 'Anonymous' : (post.display_name || 'ARK Member');
  return (
    <div className="post-detail-modal-overlay show" onClick={onClose}>
      <div className="post-detail-modal prayer-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="post-detail-close" onClick={onClose}>&times;</button>
        <PostTypeBadge type={post.post_type} />
        <div className="post-detail-header">
          <div className="post-detail-author">
            <Avatar name={authorName} url={post.avatar_url} anonymous={post.is_anonymous} large />
            <div className="author-info">
              <span className="author-name">{authorName}</span>
              <span className="post-time">{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>
        <h3 className="prayer-detail-title">{post.title || 'Prayer'}</h3>
        <div className="prayer-detail-content"><p>{post.content}</p></div>
        {post.scripture && (
          <div className="prayer-detail-scripture"><em>{post.scripture}</em></div>
        )}
        <div className="post-detail-actions">
          <span className="like-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            <span className="like-count">{post.likes_count || 0}</span>
          </span>
          <span className="praying-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-5 h-5">
              <path d="M11 21H8.5C7.7 21 7 20.6 6.6 19.9L4.1 15.4C3.7 14.7 3.7 13.8 4 13.1L7.5 6C7.9 5.1 9 4.7 9.9 5.1 10.6 5.4 11 6.1 11 6.9V21Z" />
              <path d="M13 21H15.5C16.3 21 17 20.6 17.4 19.9L19.9 15.4C20.3 14.7 20.3 13.8 20 13.1L16.5 6C16.1 5.1 15 4.7 14.1 5.1 13.4 5.4 13 6.1 13 6.9V21Z" />
            </svg>
            <span className="praying-count">{post.praying_count || 0}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── ARK Online Event Card ─── */
function EventCard({ event }: { event: ArkOnlineEvent }) {
  const dayName = DAYS[event.day_of_week] || 'TBD';
  return (
    <div className="ark-online-event">
      <div className="ark-online-event-info">
        <div className="ark-online-event-when">
          <span className="event-day">{dayName}s</span>
          <span className="event-divider">-</span>
          <span className="event-time">{event.time || 'TBD'}</span>
        </div>
        <h4 className="ark-online-event-title">{event.title}</h4>
        {event.description && <p className="ark-online-event-desc">{event.description}</p>}
      </div>
      <div className="ark-online-event-actions">
        {event.meeting_link ? (
          <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="event-join-btn">Join</a>
        ) : (
          <span className="event-join-btn disabled">Join</span>
        )}
      </div>
    </div>
  );
}

/* ─── Skeleton Loader ─── */
function SkeletonPost() {
  return (
    <div className="community-post skeleton-post">
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton w-10 h-10 rounded-full shrink-0" />
        <div>
          <div className="skeleton h-3.5 w-24 mb-1 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      </div>
      <div className="skeleton h-4 w-4/5 mb-2 rounded" />
      <div className="skeleton h-3.5 w-full mb-1.5 rounded" />
      <div className="skeleton h-3.5 w-11/12 mb-1.5 rounded" />
      <div className="skeleton h-3.5 w-3/4 rounded" />
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="skeleton h-6 w-12 rounded-xl" />
      </div>
    </div>
  );
}

/* ═══════════════ MAIN PAGE ═══════════════ */

export default function CommunityPage() {
  const { isLoggedIn } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [journalPosts, setJournalPosts] = useState<CommunityPost[]>([]);
  const [prayerPosts, setPrayerPosts] = useState<PrayerPost[]>([]);
  const [events, setEvents] = useState<ArkOnlineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<CommunityPost | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerPost | null>(null);

  const loadPosts = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) { setLoading(false); return; }

    setLoading(true);
    try {
      const [journalRes, prayerRes] = await Promise.all([
        supabase.from('community_posts').select('*').eq('post_type', 'journal').order('created_at', { ascending: false }).limit(30),
        supabase.from('community_posts').select('*').in('post_type', ['testimony', 'prayer_request']).order('created_at', { ascending: false }).limit(30),
      ]);
      if (journalRes.data) setJournalPosts(journalRes.data as CommunityPost[]);
      if (prayerRes.data) setPrayerPosts(prayerRes.data as PrayerPost[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) { setEventsLoading(false); return; }

    setEventsLoading(true);
    try {
      const { data } = await supabase.from('events').select('*').eq('is_active', true).order('day_of_week').limit(3);
      if (data) setEvents(data as ArkOnlineEvent[]);
    } catch {
      // silent
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadEvents();
  }, [loadPosts, loadEvents]);

  // Merge & filter posts
  const allPosts: AnyPost[] = [
    ...journalPosts.map(p => ({ ...p, _type: 'journal' as const })),
    ...prayerPosts.map(p => ({ ...p, _type: 'prayer' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredPosts = filter === 'all' ? allPosts
    : filter === 'journal' ? allPosts.filter(p => p._type === 'journal')
    : allPosts.filter(p => p._type === 'prayer');

  return (
    <div className="min-h-screen" style={{ background: 'var(--primary-color)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-white mb-1">Community</h1>
        <p className="text-white/60 text-sm">Journals & testimonies from the ARK community</p>
      </div>

      {/* ARK Online Section */}
      <div className="px-5 mb-5">
        <div className="ark-online-card">
          <div className="ark-online-header">
            <div className="ark-online-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
                <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
              </svg>
            </div>
            <div className="ark-online-title">
              <h2>ARK Online</h2>
              <p>Weekly Bible studies & prayer calls</p>
            </div>
          </div>

          <div className="ark-online-events">
            {eventsLoading ? (
              <div className="text-center py-4 text-white/50 text-sm">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-4 text-white/40 text-sm">No upcoming events scheduled</div>
            ) : (
              events.map(e => <EventCard key={e.id} event={e} />)
            )}
          </div>

          <div className="ark-online-actions">
            <Link href="/about" className="ark-online-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Full Schedule</span>
            </Link>
            <a href="https://www.youtube.com/@arkidentity" target="_blank" rel="noopener noreferrer" className="ark-online-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Watch Replays</span>
            </a>
          </div>
        </div>
      </div>

      {/* Community Feed */}
      <div className="px-5">
        {/* Filter Tabs */}
        <div className="community-filter-tabs">
          {(['all', 'journal', 'prayer'] as const).map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'journal' ? 'Journal' : 'Prayer'}
            </button>
          ))}
        </div>

        {/* Feed Content */}
        {!isLoggedIn ? (
          <div className="community-login-prompt">
            <div className="login-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h3>Join the Community</h3>
            <p>Sign in to view and share with the ARK community</p>
            <Link href="/login" className="community-btn-primary">Sign In</Link>
          </div>
        ) : loading ? (
          <div className="community-feed">
            <SkeletonPost /><SkeletonPost /><SkeletonPost />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="community-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>No posts yet</h3>
            <p>Be the first to share your journal entry or prayer with the community!</p>
          </div>
        ) : (
          <div className="community-feed">
            {filteredPosts.map(post => (
              post._type === 'journal' ? (
                <JournalPostCard
                  key={post.id}
                  post={post as CommunityPost}
                  onOpen={() => setSelectedJournal(post as CommunityPost)}
                />
              ) : (
                <PrayerPostCard
                  key={post.id}
                  post={post as PrayerPost}
                  onOpen={() => setSelectedPrayer(post as PrayerPost)}
                />
              )
            ))}
          </div>
        )}
      </div>

      {/* Detail Modals */}
      {selectedJournal && <JournalDetailModal post={selectedJournal} onClose={() => setSelectedJournal(null)} />}
      {selectedPrayer && <PrayerDetailModal post={selectedPrayer} onClose={() => setSelectedPrayer(null)} />}
    </div>
  );
}
