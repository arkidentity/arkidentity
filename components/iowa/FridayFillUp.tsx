'use client';

import { useEffect, useState } from 'react';
import { MEET_URL, START_HOUR, START_MINUTE, LENGTH_MINUTES } from '@/lib/fridayFillUpConfig';

// Live from 10 minutes before start until the end, Fridays, Iowa time.
function isLive(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  if (get('weekday') !== 'Fri') return false;
  const mins = Number(get('hour')) * 60 + Number(get('minute'));
  const start = START_HOUR * 60 + START_MINUTE;
  return mins >= start - 10 && mins < start + LENGTH_MINUTES;
}

export function JoinButton() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const tick = () => setLive(isLive(new Date()));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  if (!MEET_URL) {
    return <p className="text-gray-300">Join link coming soon.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {live && (
        <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Live now
        </span>
      )}
      <a
        href={MEET_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90"
        style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
      >
        Join on Google Meet
      </a>
    </div>
  );
}

// Minimal markdown: ## headings, - lists, **bold**, paragraphs, bare links.
// Plain YouTube descriptions render fine as paragraphs.
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|https?:\/\/\S+)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part))
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all">
          {part}
        </a>
      );
    return part;
  });
}

export function Notes({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-5 text-lg text-[#4a4540] leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (/^#{1,3} /.test(block))
          return (
            <h2 key={i} className="text-2xl font-bold pt-2" style={{ color: 'var(--navy)' }}>
              {block.replace(/^#{1,3} /, '')}
            </h2>
          );
        if (lines.every((l) => /^[-*] /.test(l)))
          return (
            <ul key={i} className="list-disc pl-6 space-y-2">
              {lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}
            </ul>
          );
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
