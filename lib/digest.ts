import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendDigestEmail, siteUrl, type DigestPost } from '@/lib/email';
import type { Contact } from '@/lib/contacts';
import type { Post } from '@/lib/feed';

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

function excerptOf(post: Post): string {
  const body = (post.final_text || post.draft_text || '').replace(/\s+/g, ' ').trim();
  return body.length > 220 ? body.slice(0, 217).trimEnd() + '…' : body;
}

function leadImage(post: Post): string | null {
  const photo = (post.media ?? []).find((m) => m.type === 'photo');
  if (photo) return photo.url;
  if (post.media_type === 'photo') return post.display_media_url || post.raw_media_url;
  return null;
}

export interface DigestSummary {
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export async function runDigests(): Promise<DigestSummary> {
  const supabase = getSupabaseAdmin();
  const summary: DigestSummary = { sent: 0, skipped: 0, failed: 0, errors: [] };
  const now = Date.now();

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
      .order('published_at', { ascending: true });

    const posts = (postRows as Post[]) ?? [];
    if (posts.length === 0) {
      summary.skipped++;
      continue;
    }

    const digestPosts: DigestPost[] = posts.map((p) => ({
      id: p.id,
      headline: p.headline || '',
      excerpt: excerptOf(p),
      imageUrl: leadImage(p),
      publishedAt: p.published_at,
    }));

    const unsubscribeUrl = `${siteUrl()}/unsubscribe?token=${person.unsubscribe_token}`;

    try {
      await sendDigestEmail(person.email, person.name, digestPosts, unsubscribeUrl);
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
