import { timingSafeEqual } from 'crypto';

// Bearer FEED_DRAFT_TOKEN: the narrow key Travis's Claude routines use (create feed
// drafts, read the open prayer list). Never the database key.
export function automationAuthorized(req: Request): boolean {
  const token = process.env.FEED_DRAFT_TOKEN;
  const given = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!token || token.length < 32 || given.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(token));
}
