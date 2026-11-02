// Monday partner update → a DRAFT post in the ARK feed (Travis reviews and publishes in /admin).
//
//   node scripts/feed-draft.mjs <folder>
//
// The folder holds update.md (first "# " line = headline; body runs until the first
// "---" line) and the photos (*.jpg|jpeg|png|webp|heic), attached in filename order.
// Goes through the live site's draft-only endpoint (/api/feed/draft), so this Mac
// holds only FEED_DRAFT_TOKEN in .env.local, never the database key.
// FEED_DRAFT_URL overrides the site (e.g. http://localhost:3000 for testing).
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')])
);
const token = env.FEED_DRAFT_TOKEN;
if (!token) throw new Error('Add FEED_DRAFT_TOKEN to .env.local first.');
const site = env.FEED_DRAFT_URL || 'https://www.arkidentity.com';

async function call(payload) {
  const res = await fetch(`${site}/api/feed/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const folder = process.argv[2];
if (!folder) throw new Error('Usage: node scripts/feed-draft.mjs <folder>');

const md = readFileSync(join(folder, 'update.md'), 'utf8');
const lines = md.split('\n');
const headline = (lines.find((l) => l.startsWith('# ')) || '').slice(2).trim() || null;
const end = lines.findIndex((l) => l.trim() === '---');
const body = lines
  .slice(0, end === -1 ? undefined : end)
  .filter((l) => !l.startsWith('# ') && !/^Photos, in order/i.test(l))
  .join('\n')
  .trim();

const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.heic': 'image/heic' };
const photos = readdirSync(folder).filter((f) => TYPES[extname(f).toLowerCase()]).sort();

const paths = [];
for (const f of photos) {
  const { path, signedUrl } = await call({ sign: { filename: f } });
  const put = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': TYPES[extname(f).toLowerCase()] },
    body: readFileSync(join(folder, f)),
  });
  if (!put.ok) throw new Error(`${f}: upload failed (${put.status})`);
  paths.push(path);
  console.log('uploaded', f);
}

const { id } = await call({ create: { headline, body, photos: paths } });
console.log(`Draft ${id}: "${headline}" with ${paths.length} photo(s). Review and publish in /admin.`);
