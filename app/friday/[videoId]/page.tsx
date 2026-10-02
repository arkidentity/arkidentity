import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Notes } from '@/components/iowa/FridayFillUp';
import { getEpisodes, getNotes, formatDate } from '@/lib/fridayFillUp';

export const revalidate = 3600;

async function find(videoId: string) {
  return (await getEpisodes()).find((e) => e.id === videoId);
}

export async function generateMetadata({ params }: { params: Promise<{ videoId: string }> }): Promise<Metadata> {
  const ep = await find((await params).videoId);
  return ep ? { title: `${ep.title} | Friday Fill Up`, description: ep.description.slice(0, 160) } : {};
}

export default async function EpisodePage({ params }: { params: Promise<{ videoId: string }> }) {
  const ep = await find((await params).videoId);
  if (!ep) notFound();
  const notes = await getNotes(ep);

  return (
    <section className="py-12 md:py-16" style={{ background: '#FAF8F5' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/friday" className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
          ← All teachings
        </Link>
        <p className="text-sm text-gray-500 mt-6 mb-1">Friday Fill Up · {formatDate(ep.published)}</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: 'var(--navy)' }}>{ep.title}</h1>
        <div className="aspect-video rounded-xl overflow-hidden bg-black mb-10">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ep.id}`}
            title={ep.title}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        {notes && <Notes text={notes} />}
      </div>
    </section>
  );
}
