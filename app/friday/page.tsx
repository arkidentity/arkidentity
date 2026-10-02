import type { Metadata } from 'next';
import Link from 'next/link';
import { JoinButton } from '@/components/iowa/FridayFillUp';
import { getEpisodes, formatDate, timeLabel, LENGTH_MINUTES } from '@/lib/fridayFillUp';

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
      <section className="py-20 md:py-28" style={{ background: 'var(--navy)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <p className="uppercase tracking-widest text-sm mb-4" style={{ color: 'var(--gold)' }}>
            ARK Identity
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">Friday Fill Up</h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8">
            Every Friday · {timeLabel()} Central · {LENGTH_MINUTES} minutes
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>15</p>
              <p className="text-gray-200">min Bible study</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>15</p>
              <p className="text-gray-200">min discussion</p>
            </div>
          </div>
          <JoinButton />
        </div>
      </section>

      <section className="py-16 md:py-20" style={{ background: '#F5F2EE' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-2" style={navy}>Want to catch up?</h2>
          <p className="text-lg text-[#4a4540] mb-10">Watch any past teaching and read the notes.</p>

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
