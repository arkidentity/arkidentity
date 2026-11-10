import Image from 'next/image';
import Link from 'next/link';

// DRAFT (11/9, v2): hidden until Travis approves. noindex + not linked from the site. This is the
// "entity home" for Google: neutral, third person, Wikipedia-style sections. Every fact comes from
// ark-workspace/projects/travis-online/BIO-KIT.md (the one source of truth); unconfirmed facts stay off.
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
    '@id': 'https://arkidentity.com/travis#person',
    name: 'Travis Gluckler',
    url: 'https://arkidentity.com/travis',
    image: 'https://arkidentity.com/images/travis.JPG',
    jobTitle: 'Founder and National Director, ARK Identity',
    description: 'Author, church planter and campus minister. Founder of ARK Identity and builder of Daily DNA.',
    worksFor: { '@type': 'Organization', name: 'ARK Identity', url: 'https://arkidentity.com' },
    knowsAbout: ['Discipleship', 'Disciple making', 'Church multiplication', 'Campus ministry', 'Identity in Christ'],
    spouse: { '@type': 'Person', name: 'Kimberly Gluckler' },
    alumniOf: { '@type': 'HighSchool', name: 'Monroe-Woodbury High School' },
    homeLocation: { '@type': 'Place', name: 'Iowa' },
    memberOf: { '@type': 'Organization', name: 'Global Service Associates' },
    subjectOf: [
      { '@type': 'VideoObject', name: 'Travis and Kimberly Gluckler saved in Sin City', embedUrl: 'https://www.youtube.com/embed/27NsQjBbab4', thumbnailUrl: 'https://i.ytimg.com/vi/27NsQjBbab4/hqdefault.jpg' },
    ],
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
    body: 'Travis met Jesus in Las Vegas through pastor Vince Antonucci. God restored his marriage to Kimberly, and the two of them began opening their home to people who wanted to follow Jesus.',
  },
  {
    year: '2013',
    title: 'ARK Identity begins',
    body: 'He founded ARK Identity with a handful of disciples in Las Vegas. His first courses, ARK 101 and ARK 102, became Identity Through the Trinity and Freedom.',
  },
  {
    year: '2020',
    title: 'Training goes online',
    body: "ARK's first in-person training at Encounter Church Las Vegas was set for the week the pandemic shut the country down, so it went live on Zoom. More than 1,000 students in multiple states have trained with ARK since. That November the Glucklers moved to Colorado.",
  },
  {
    year: '2023',
    title: 'To Iowa',
    body: 'The Glucklers moved to Iowa.',
  },
  {
    year: '2025',
    title: 'ARK Iowa launches',
    body: 'Travis officially launched ARK Iowa, a campus ministry at the University of Iowa where students meet around tables of four to open Scripture. He also builds Daily DNA, a discipleship app used by churches in North America and Latin America, and wrote Table Up.',
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
  ['27NsQjBbab4', 'Travis and Kimberly Gluckler: saved in Sin City (2012)'],
  ['ZYB6Yw_TEeg', "Travis Gluckler's testimony, Delafé Testimonies (2024)"],
];

const BOOKS: { title: string; line: string; href?: string }[] = [
  { title: 'Table Up', line: 'Disciple making that actually multiplies your church. Foreword by Vince Antonucci.' },
  { title: 'The ARK Identity Training series', line: 'Identity Through the Trinity, The Bridge: Prophetic Evangelism and more.', href: 'https://www.amazon.com/dp/B09MGCW4V4' },
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
                Author, church planter and campus minister. Founder of ARK Identity and Daily DNA.
              </p>
            </div>
            <a href="#talk" className="mt-6 md:mt-0 inline-block w-full md:w-auto text-center px-8 py-4 rounded-md font-semibold text-lg transition hover:brightness-105" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}>
              Contact Travis
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT: the long bio from BIO-KIT.md */}
      <section className="pt-16 md:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-[1fr_16rem] gap-10 items-start">
          <div className="max-w-2xl text-lg leading-relaxed text-[#3d3a36] space-y-5">
            <p>
              <strong>Travis Gluckler</strong> is an author, church planter and campus minister, and the founder of ARK
              Identity, a discipleship ministry that helps believers know God and who God says they are. He grew up in
              Monroe, New York, graduated from Monroe-Woodbury High School in 1999, and lives in Iowa with his wife,
              Kimberly, and their four children.
            </p>
            <p>
              Years of leading groups that depended on him led Travis to a simpler model: put the tools in the hands of
              ordinary people. That became DNA Discipleship and the Daily DNA app, and his book <em>Table Up: Disciple
              making that actually multiplies your church</em>. He also created Creed Cards and teaches Friday Fill Up each
              week. He is a commissioned member of Global Service Associates.
            </p>
          </div>
          <dl className="text-sm border-t-2 pt-4 space-y-3" style={{ borderColor: 'var(--gold)' }}>
            <div><dt className="font-semibold" style={{ color: 'var(--navy)' }}>Known for</dt><dd className="text-[#3d3a36]">ARK Identity, Daily DNA, Table Up</dd></div>
            <div><dt className="font-semibold" style={{ color: 'var(--navy)' }}>Ministry</dt><dd className="text-[#3d3a36]">Campus minister, University of Iowa</dd></div>
            <div><dt className="font-semibold" style={{ color: 'var(--navy)' }}>Came to faith</dt><dd className="text-[#3d3a36]">Las Vegas, 2009</dd></div>
            <div><dt className="font-semibold" style={{ color: 'var(--navy)' }}>Hometown</dt><dd className="text-[#3d3a36]">Monroe, New York</dd></div>
            <div><dt className="font-semibold" style={{ color: 'var(--navy)' }}>Lives in</dt><dd className="text-[#3d3a36]">Iowa (since 2023)</dd></div>
            <div><dt className="font-semibold" style={{ color: 'var(--navy)' }}>Family</dt><dd className="text-[#3d3a36]">Married to Kimberly Gluckler; four children</dd></div>
          </dl>
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

      {/* BOOKS */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--navy)' }}>Books</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_20rem] gap-10 items-start">
            <ul>
              {BOOKS.map((b) => (
                <li key={b.title} className="py-5 border-t border-[#e6e0d6]">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}><cite className="not-italic">{b.title}</cite></h3>
                  <p className="mt-1 text-[#3d3a36]">{b.line}</p>
                  {b.href && <a href={b.href} className="mt-2 inline-block font-semibold underline" style={{ color: 'var(--navy)' }}>See it on Amazon</a>}
                </li>
              ))}
            </ul>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ark books.jpg" alt="Books in The ARK Identity Training series by Travis Gluckler" className="w-full rounded-md" />
          </div>
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
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--navy)' }}>Ministry and work</h2>
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
            Podcasts: The ARK Identity Podcast, The Friday Fill Up Podcast and The Bridge Evangelism Podcast.
          </p>
        </div>
      </section>

      {/* TALK */}
      <section id="talk" style={{ background: 'var(--navy)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:flex md:items-end md:justify-between md:gap-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold">Contact</h2>
            <p className="mt-3 text-lg text-[#d9dde2]">
              For speaking, church coaching, interviews or prayer, write to Travis at ARK Identity.
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
