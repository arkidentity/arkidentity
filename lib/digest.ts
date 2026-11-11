import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendDigestEmail, siteUrl, type DigestPost } from '@/lib/email';
import { postExcerpt, postLeadImage, postLeadVideo, videoThumbnail } from '@/lib/feed';
import type { Contact } from '@/lib/contacts';
import type { Post } from '@/lib/feed';

// A highlight digest, not a backlog dump: even if a subscriber has ten new
// posts queued up, the email leads with the most recent and shows at most
// this many — the rest stay on the feed for them to browse. Posts beyond the
// cap are still marked sent (see `sends` below) and never resurface later.
const MAX_DIGEST_POSTS = 3;

// Builds and sends each due subscriber's email digest. Called by the daily cron.
// Recipients are contacts with `subscribed` on — the newsletter is one slice of
// the contacts table, not a separate list. Text-channel contacts are handled
// manually in Gloo (Copy-text helper), so only email / both are emailed here.
//
// `confirmed` is still filtered on: nothing issues confirmation links any more,
// but rows left pending under the old double opt-in never opted in, so they
// stay unmailed.

const DAY = 24 * 60 * 60 * 1000;
const DUE_DAYS: Record<Contact['frequency'], number> = { weekly: 7, monthly: 28 };

// Resend's free plan allows 100 emails/day across ALL our mail (study
// reminders, Iowa digests, alerts, etc.), so the donor digest gets a daily
// budget. Anyone over the cap simply stays "due" and goes out on tomorrow's
// cron run, which naturally staggers the list across days (and keeps it
// staggered, since each person's next send is measured from their own last
// send). Override with DIGEST_DAILY_CAP; raise it after upgrading Resend.
const DEFAULT_DAILY_CAP = 40;

function dailyCap(): number {
  const n = Number(process.env.DIGEST_DAILY_CAP);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_DAILY_CAP;
}

export interface DigestSummary {
  sent: number;
  deferred: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export async function runDigests(): Promise<DigestSummary> {
  const supabase = getSupabaseAdmin();
  const summary: DigestSummary = { sent: 0, deferred: 0, skipped: 0, failed: 0, errors: [] };
  const now = Date.now();
  const cap = dailyCap();

  const { data: contactRows, error: pErr } = await supabase
    .from('contacts')
    .select('*')
    .eq('subscribed', true)
    .eq('confirmed', true)
    .in('channel', ['email', 'both']);
  if (pErr) throw new Error(pErr.message);

  const subscribers = (contactRows as Contact[]) ?? [];

  for (const person of subscribers) {
    if (!person.email) {
      summary.skipped++;
      continue;
    }

    // Last email digest we sent them.
    const { data: lastSend } = await supabase
      .from('sends')
      .select('sent_at')
      .eq('contact_id', person.id)
      .eq('channel', 'email')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastSentAt = lastSend?.sent_at ? new Date(lastSend.sent_at).getTime() : null;

    // Cadence gate.
    if (lastSentAt !== null) {
      const daysSince = (now - lastSentAt) / DAY;
      if (daysSince < DUE_DAYS[person.frequency]) {
        summary.skipped++;
        continue;
      }
    }

    // New posts since the last send (or since they joined, if never sent).
    const sinceIso = new Date(
      lastSentAt ?? new Date(person.confirmed_at ?? person.created_at).getTime()
    ).toISOString();

    const { data: postRows } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .gt('published_at', sinceIso)
      .order('published_at', { ascending: false });

    const posts = (postRows as Post[]) ?? [];
    if (posts.length === 0) {
      summary.skipped++;
      continue;
    }

    // Everything new counts as "sent" (it won't be offered again — sinceIso
    // moves to now), but only the most recent MAX_DIGEST_POSTS actually appear
    // in the email, newest first.
    // Daily budget reached: leave this person due (no `sends` row is written),
    // so tomorrow's run picks them up with all their new posts.
    if (summary.sent + summary.failed >= cap) {
      summary.deferred++;
      continue;
    }

    const featured = posts.slice(0, MAX_DIGEST_POSTS);

    const digestPosts: DigestPost[] = featured.map((p) => {
      const video = postLeadVideo(p);
      return {
        id: p.id,
        headline: p.headline || '',
        excerpt: postExcerpt(p, 220),
        imageUrl: (video && videoThumbnail(video)) || postLeadImage(p),
        videoUrl: video?.provider ? video.url : null,
        publishedAt: p.published_at,
      };
    });

    const unsubscribeUrl = `${siteUrl()}/unsubscribe?token=${person.unsubscribe_token}`;

    try {
      const prayUrl = `${siteUrl()}/pray?t=${person.unsubscribe_token}`;
      await sendDigestEmail(person.email, person.name, digestPosts, unsubscribeUrl, prayUrl);
      await supabase.from('sends').insert({
        contact_id: person.id,
        post_ids: posts.map((p) => p.id),
        channel: 'email',
        status: 'sent',
      });
      summary.sent++;
    } catch (e) {
      summary.failed++;
      summary.errors.push(`${person.email}: ${(e as Error).message}`);
      await supabase.from('sends').insert({
        contact_id: person.id,
        post_ids: posts.map((p) => p.id),
        channel: 'email',
        status: 'failed',
      });
    }
  }

  return summary;
}
