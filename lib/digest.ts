import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendDigestEmail, siteUrl, type DigestPost } from '@/lib/email';
import type { Partner } from '@/lib/partners';
import type { Post } from '@/lib/feed';

// Builds and sends each due partner's email digest. Called by the daily cron.
// Text partners are handled manually in Gloo (Copy-text helper), so only
// email / both channels are emailed here.

const DAY = 24 * 60 * 60 * 1000;
const DUE_DAYS: Record<Partner['frequency'], number> = { weekly: 7, monthly: 28 };

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

  const { data: partnerRows, error: pErr } = await supabase
    .from('partners')
    .select('*')
    .eq('active', true)
    .eq('confirmed', true)
    .in('channel', ['email', 'both']);
  if (pErr) throw new Error(pErr.message);

  const partners = (partnerRows as Partner[]) ?? [];

  for (const partner of partners) {
    if (!partner.email) {
      summary.skipped++;
      continue;
    }

    // Last email digest we sent this partner.
    const { data: lastSend } = await supabase
      .from('sends')
      .select('sent_at')
      .eq('partner_id', partner.id)
      .eq('channel', 'email')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastSentAt = lastSend?.sent_at ? new Date(lastSend.sent_at).getTime() : null;

    // Cadence gate.
    if (lastSentAt !== null) {
      const daysSince = (now - lastSentAt) / DAY;
      if (daysSince < DUE_DAYS[partner.frequency]) {
        summary.skipped++;
        continue;
      }
    }

    // New posts since the last send (or since they joined, if never sent).
    const sinceIso = new Date(
      lastSentAt ?? new Date(partner.confirmed_at ?? partner.created_at).getTime()
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
      headline: excerptOf(p).split('. ')[0],
      excerpt: excerptOf(p),
      imageUrl: leadImage(p),
      publishedAt: p.published_at,
    }));

    const unsubscribeUrl = `${siteUrl()}/unsubscribe?token=${partner.unsubscribe_token}`;

    try {
      await sendDigestEmail(partner.email, partner.name, digestPosts, unsubscribeUrl);
      await supabase.from('sends').insert({
        partner_id: partner.id,
        post_ids: posts.map((p) => p.id),
        channel: 'email',
        status: 'sent',
      });
      summary.sent++;
    } catch (e) {
      summary.failed++;
      summary.errors.push(`${partner.email}: ${(e as Error).message}`);
      await supabase.from('sends').insert({
        partner_id: partner.id,
        post_ids: posts.map((p) => p.id),
        channel: 'email',
        status: 'failed',
      });
    }
  }

  return summary;
}
