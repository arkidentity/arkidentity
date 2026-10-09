import type { Metadata } from 'next';
import Link from 'next/link';
import { JoinButton } from '@/components/iowa/FridayFillUp';
import { getEpisodes, formatDate, timeLabel, LENGTH_MINUTES, PLAYLIST_ID } from '@/lib/fridayFillUp';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Friday Fill Up | ARK Identity',
  description: 'Thirty minutes every Friday morning: a 15-minute Bible study and 15 minutes of discussion. Join live on Google Meet or catch up on past teachings.',
  openGraph: {
    title: 'Friday Fill Up | ARK Identity',
    description: 'Thirty minutes every Friday. Join live or catch up on past teachings.',
    url: 'https://arkidentity.com/friday',
    siteName: 'ARK Identity',
    type: 'website',
  },
};

const navy = { color: 'var(--navy)' };

export default async function FridayFillUpPage() {
  const episodes = await getEpisodes();

  return (
    <>
      <section className="py-10 md:py-14" style={{ background: 'var(--navy)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-2">Friday Fill Up</h1>
          <p className="text-lg md:text-xl text-gray-200 mb-1">
            Every Friday · {timeLabel()} Central
          </p>
          <p className="text-gray-300 mb-6">{LENGTH_MINUTES} minutes: a 15-minute Bible study, then discussion</p>
          <JoinButton />
        </div>
      </section>

      <section className="py-16 md:py-20" style={{ background: '#F5F2EE' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-2" style={navy}>Want to catch up?</h2>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <p className="text-lg text-[#4a4540]">Watch any past teaching and read the notes.</p>
            <a
              href={`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF0000] px-4 py-2 font-semibold text-white transition hover:opacity-90"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              Watch on YouTube
            </a>
          </div>

          {episodes.length === 0 ? (
            <p className="text-lg text-[#4a4540]">The first teaching will show up here after it’s recorded.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/friday/${ep.id}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ep.thumbnail} alt="" className="w-full aspect-video object-cover" loading="lazy" />
                  <div className="p-4">
                    <p className="text-sm text-gray-500 mb-1">{formatDate(ep.published)}</p>
                    <p className="font-semibold text-lg leading-snug group-hover:underline" style={navy}>
                      {ep.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
