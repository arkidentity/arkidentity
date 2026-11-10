import Image from 'next/image';
import Link from 'next/link';

// DRAFT (11/9): hidden until Travis approves. noindex + not linked from the site. Copy is a first pass
// in Travis's voice from travisandtheghost.com and /about; Travis rewrites it. Plan:
// ark-workspace/projects/travis-online/PLAN.md.
// Design (human-made-sites skill): concept = a testimony told across a table, year by year. The one bold
// thing is the year rail (big Archivo years down the left). Type and colors are the site's (Archivo +
// Public Sans, ARK navy + gold, warm #f3efe8). Hero reuses the /giving and Baja pattern (clear photo,
// navy band, button right) on purpose for site consistency.
export const metadata = {
  title: 'Travis Gluckler: author, church planter and campus minister',
  description:
    'Travis Gluckler founded ARK Identity, leads ARK Iowa at the University of Iowa and builds Daily DNA, a discipleship app for churches.',
  alternates: { canonical: 'https://arkidentity.com/travis' },
  robots: { index: false, follow: false },
};

const PERSON = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    name: 'Travis Gluckler',
    url: 'https://arkidentity.com/travis',
    image: 'https://arkidentity.com/images/travis.JPG',
    jobTitle: 'Founder and National Director, ARK Identity',
    description: 'Author, church planter and campus minister. Founder of ARK Identity and builder of Daily DNA.',
    worksFor: { '@type': 'Organization', name: 'ARK Identity', url: 'https://arkidentity.com' },
    knowsAbout: ['Discipleship', 'Church planting', 'Campus ministry', 'Identity in Christ'],
    // Every profile from PLAN.md step 2 goes here once it's updated to match.
    sameAs: [
      'https://www.travisandtheghost.com',
      'https://dnadiscipleship.com',
      'https://creedcards.com',
    ],
  },
};

const YEARS: { year: string; title: string; body: string }[] = [
  {
    year: '2009',
    title: 'Saved in Sin City',
    body: 'Kimberly and I met Jesus in Las Vegas, and He started with our marriage. We were done, and He restored it anyway. Everything I do now comes out of that year.',
  },
  {
    year: '2013',
    title: 'ARK Identity begins',
    body: 'It started with a handful of disciples in Las Vegas. I wrote what God was teaching me about identity in Christ, and we tested it on each other until it worked.',
  },
  {
    year: '2020',
    title: 'The week everything moved online',
    body: 'Our first in-person training at Encounter Church Las Vegas landed the same week the country shut down, so we went live on Zoom. Since then more than 1,000 students in multiple states have trained with ARK. That November we moved to Colorado.',
  },
  {
    year: 'Now',
    title: 'Iowa, tables and an app',
    body: 'Today I lead ARK Iowa at the University of Iowa, where students meet around tables of four and open Scripture every day. I also build Daily DNA, the app churches use to make disciples who make disciples.',
  },
];

const WORK: [string, string, string][] = [
  ['ARK Identity', 'Training that helps believers know God and who God says they are.', '/'],
  ['ARK Iowa', 'Campus ministry at the University of Iowa.', '/iowa'],
  ['Daily DNA and DNA Discipleship', 'An app and a coaching path for churches that want disciples who multiply.', 'https://dnadiscipleship.com'],
  ['Creed Cards', 'Big beliefs on small cards: the creeds, one card at a time.', 'https://creedcards.com'],
  ['Friday Fill Up', 'A short weekly teaching, live with students.', '/friday'],
];

const VIDEOS: [string, string][] = [
  ['27NsQjBbab4', 'Our story, 2012: Travis and Kimberly saved in Sin City'],
  ['ZYB6Yw_TEeg', 'My story, 2024 (Delafé Testimonies)'],
];

export default function TravisPage() {
  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />

      {/* HERO: clear photo, name on a solid band */}
      <section>
        <div className="relative w-full aspect-[4/3] md:aspect-[16/9] bg-[#1a2b3c]">
          <Image src="/photos/travis-worship.jpg" alt="Travis Gluckler leading worship with a student on keys" fill priority sizes="100vw" className="object-cover object-[35%_30%]" />
        </div>
        <div style={{ background: 'var(--navy)' }} className="text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 md:flex md:items-end md:justify-between md:gap-10">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold leading-[1.05]">Travis Gluckler</h1>
              <p className="mt-4 text-lg md:text-xl text-[#d9dde2]">
                Author, church planter and campus minister. I build tools that help ordinary people make disciples.
              </p>
            </div>
            <a href="#talk" className="mt-6 md:mt-0 inline-block w-full md:w-auto text-center px-8 py-4 rounded-md font-semibold text-lg transition hover:brightness-105" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}>
              Talk with me
            </a>
          </div>
        </div>
      </section>

      {/* THE YEAR RAIL */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {YEARS.map((y) => (
            <div key={y.year} className="grid grid-cols-[5.5rem_1fr] md:grid-cols-[12rem_1fr] gap-4 md:gap-10 py-8 border-t border-[#e6e0d6] first:border-t-0">
              <p className="text-4xl md:text-7xl font-bold leading-none" style={{ color: 'var(--gold)' }}>{y.year}</p>
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--navy)' }}>{y.title}</h2>
                <p className="mt-3 text-lg leading-relaxed text-[#3d3a36]">{y.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VIDEOS */}
      <section className="py-16 md:py-20" style={{ background: '#f3efe8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--navy)' }}>Watch the story</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 items-start">
            {VIDEOS.map(([id, title]) => (
              <figure key={id}>
                <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={title}
                    loading="lazy"
                    allow="accelerometer; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <figcaption className="mt-3 text-[#3d3a36]">{title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT I'M BUILDING */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--navy)' }}>What I&apos;m building</h2>
          <ul className="mt-8">
            {WORK.map(([name, line, href]) => (
              <li key={name} className="py-5 border-t border-[#e6e0d6] md:flex md:items-baseline md:justify-between md:gap-8">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>{name}</h3>
                  <p className="mt-1 text-[#3d3a36]">{line}</p>
                </div>
                {href.startsWith('/') ? (
                  <Link href={href} className="mt-2 md:mt-0 inline-block font-semibold underline shrink-0" style={{ color: 'var(--navy)' }}>Visit</Link>
                ) : (
                  <a href={href} className="mt-2 md:mt-0 inline-block font-semibold underline shrink-0" style={{ color: 'var(--navy)' }}>Visit</a>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-2xl text-lg text-[#3d3a36]">
            I also write. <strong>Table Up</strong> is my book for pastors who know something is missing between what they
            built and what Jesus described. And you can hear me on the ARK Identity, Friday Fill Up and Bridge Evangelism podcasts.
          </p>
        </div>
      </section>

      {/* TALK */}
      <section id="talk" style={{ background: 'var(--navy)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:flex md:items-end md:justify-between md:gap-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold">Want to talk?</h2>
            <p className="mt-3 text-lg text-[#d9dde2]">
              Speaking, coaching your church, prayer, or a question about any of this. Write me and I&apos;ll write back.
            </p>
          </div>
          <a href="mailto:info@arkidentity.com?subject=Hi%20Travis" className="mt-6 md:mt-0 inline-block w-full md:w-auto text-center px-8 py-4 rounded-md font-semibold text-lg transition hover:brightness-105" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}>
            Email Travis
          </a>
        </div>
      </section>
    </div>
  );
}
