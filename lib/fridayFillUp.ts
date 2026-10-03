import { readFile } from 'fs/promises';
import path from 'path';

import { PLAYLIST_ID, START_HOUR, START_MINUTE } from './fridayFillUpConfig';
export * from './fridayFillUpConfig';

export type Episode = {
  id: string;
  title: string;
  published: string;
  description: string;
  thumbnail: string;
};

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]).trim() : '';
}

// YouTube's public playlist feed: no API key, newest 15 videos. The feed
// randomly 404s about half the time, so retry; if every try fails, throw so
// Next keeps serving the last good page instead of caching an empty list.
export async function getEpisodes(): Promise<Episode[]> {
  if (!PLAYLIST_ID) return [];
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      // Distinct URL per attempt so a cached 404 from one try can't block the next.
      const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}&try=${attempt}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) return parseFeed(await res.text());
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  // A first build with no previous page to fall back on: render empty rather than fail the deploy.
  if (process.env.NEXT_PHASE === 'phase-production-build') return [];
  throw new Error('YouTube playlist feed unavailable');
}

function parseFeed(xml: string): Episode[] {
  return xml
    .split('<entry>')
    .slice(1)
    .map((entry) => {
      const id = tag(entry, 'yt:videoId');
      return {
        id,
        title: tag(entry, 'title'),
        published: tag(entry, 'published'),
        description: tag(entry, 'media:description'),
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    })
    .filter((e) => e.id)
    .sort((a, b) => b.published.localeCompare(a.published));
}

// Teaching notes: data/friday-fill-up/<videoId>.md if it exists, otherwise the
// YouTube description. Writing notes in the description is enough.
export async function getNotes(episode: Episode): Promise<string> {
  if (!/^[\w-]+$/.test(episode.id)) return episode.description;
  try {
    return await readFile(path.join(process.cwd(), 'data/friday-fill-up', `${episode.id}.md`), 'utf8');
  } catch {
    return episode.description;
  }
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });
}

export function timeLabel() {
  const d = new Date(Date.UTC(2000, 0, 1, START_HOUR, START_MINUTE));
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}
