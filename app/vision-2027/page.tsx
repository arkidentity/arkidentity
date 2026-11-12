import Image from 'next/image';
import Script from 'next/script';

// Hidden until Travis OKs it: noindex and not linked from the menu.
// Copy approved in the Vision 2027 lab (ark-workspace/projects/ark-identity/year-end-2026/giving-tuesday-lab.html).
// Design (human-made-sites, 11/11): reuses the /giving hero (clear 16:9 photo + navy band, button right)
// for site consistency. The one bold thing is the monthly support bar. Photos keep their own ratio.
export const metadata = {
  title: 'Vision 2027 - ARK Identity',
  description: 'Give to the kind of ministry that multiplies. Students at Iowa are making disciples who make disciples.',
  robots: { index: false, follow: false },
};

// Update these as support comes in.
const RAISED = 6500;
const GOAL = 8000;
const GAP = GOAL - RAISED;
const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

// TODO: swap in the Vision 2027 DonorView form (monthly, $50 default) when GSA sends it.
const DONORVIEW_FORM = 'https://app.dvforms.net/api/dv/zkyz4k';

const HIGHLIGHTS: [string, string][] = [
  ['About 250 students', 'in real conversations about Jesus in the first two and a half weeks of school.'],
  ['Seven Bible studies', 'formed in September, in groups of four.'],
  ['Seven students', 'on our first Tuesday morning prayer call, some praying out loud for the first time.'],
  ['53 students', 'reading Scripture and praying with the Daily DNA app.'],
  ['Trick or Truth:', 'students out on Halloween night sharing their faith, many for the first time.'],
];

const ink = 'var(--navy)';
const body = 'text-lg leading-relaxed text-[#3d3a36]';

function Photo({ src, alt, w, h }: { src: string; alt: string; w: number; h: number }) {
  return <Image src={src} alt={alt} width={w} height={h} sizes="(min-width: 768px) 720px, 100vw" className="w-full h-auto rounded-md" />;
}

export default function Vision2027() {
  const pct = Math.round((RAISED / GOAL) * 100);
  return (
    <div className="bg-white">
      {/* HERO */}
      <section>
        <div className="relative w-full aspect-[16/9] bg-[#1a2b3c]">
          <Image src="/photos/vision-2027/sunday-dinner.jpg" alt="Students around the Glucklers' table at Sunday dinner" fill priority sizes="100vw" className="object-cover" />
        </div>
        <div style={{ background: ink }} className="text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 md:flex md:items-end md:justify-between md:gap-10">
            <div className="max-w-2xl">
              <p className="font-bold" style={{ color: 'var(--gold)' }}>Vision 2027</p>
              <h1 className="mt-2 text-4xl md:text-6xl font-bold leading-[1.05]">Give to the kind of ministry that multiplies.</h1>
              <p className="mt-4 text-lg md:text-xl text-[#d9dde2]">
                You want to know your giving bears fruit. This fall at Iowa, a student who had never shared her faith met three
                women on Halloween and was leading their Bible study the next Friday.
              </p>
            </div>
            <a href="#give" className="mt-6 md:mt-0 inline-block w-full md:w-auto shrink-0 text-center px-8 py-4 rounded-md font-semibold text-lg transition hover:brightness-105" style={{ backgroundColor: 'var(--gold)', color: ink }}>
              Join the monthly team
            </a>
          </div>
        </div>
      </section>

      {/* SUPPORT BAR */}
      <section className="pt-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p style={{ color: ink }}><span className="text-3xl font-bold">{fmt(RAISED)}</span> <span className="text-[#5b5650]">of {fmt(GOAL)} a month</span></p>
            <p style={{ color: ink }}><span className="text-xl font-bold">{fmt(GAP)}</span> <span className="text-[#5b5650]">a month to go</span></p>
          </div>
          <div className="mt-3 h-3 rounded-full bg-[#ece6dc] overflow-hidden" role="progressbar" aria-valuenow={RAISED} aria-valuemin={0} aria-valuemax={GOAL} aria-label="Monthly support">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--gold)' }} />
          </div>
          <p className="mt-2 text-sm text-[#5b5650]">Monthly support for the Gluckler family&apos;s ministry, as of November.</p>
        </div>
      </section>

      {/* STORIES */}
      <section id="stories" className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: ink }}>The question we ask: did they go make another disciple?</h2>
          <p className={`mt-4 ${body}`}>
            A crowd can grow for years while almost no one learns to lead someone else to Jesus. So we watch for the moment a
            student starts discipling someone else. This fall it happened again and again.
          </p>

          <figure className="mt-10">
            <Photo src="/photos/vision-2027/travis-keilor-morgan.jpg" alt="Travis with Keilor and Morgan at a table" w={1400} h={873} />
            <blockquote className="mt-6 text-xl leading-relaxed font-medium" style={{ color: ink }}>
              Morgan came out to Trick or Truth with no experience sharing her faith. That night she met three young women who
              wanted to study the Bible. The next Friday, Morgan and her friend McKenna led that study. Now they&apos;re on our
              prayer calls, and they all came to our house for Sunday dinner.
            </blockquote>
            <figcaption className="mt-3 text-sm text-[#5b5650]">Morgan, center in green</figcaption>
          </figure>

          <figure className="mt-14 pt-10 border-t border-[#e3ddd3]">
            <Photo src="/photos/vision-2027/keilor-gabe.jpg" alt="Keilor and Gabe with Travis" w={1400} h={836} />
            <blockquote className="mt-6 text-xl leading-relaxed font-medium" style={{ color: ink }}>
              Keilor has come out to share Jesus every Tuesday this fall. He took over one of my Bible studies, started another
              with freshmen from his hometown, and leads our Tuesday morning prayer call. At our last worship night, he played
              piano in front of people for the first time.
            </blockquote>
            <figcaption className="mt-3 text-sm text-[#5b5650]">Keilor (left) and Gabe, juniors and ARK student leaders</figcaption>
          </figure>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="py-16 md:py-20" style={{ background: '#f3efe8' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: ink }}>This fall at Iowa</h2>
          <ul className="mt-6">
            {HIGHLIGHTS.map(([b, rest]) => (
              <li key={b} className="py-4 border-t border-[#ddd6ca] text-lg text-[#3d3a36]"><strong style={{ color: ink }}>{b}</strong> {rest}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-[#5b5650]">From our partner updates, August to November 2026.</p>
        </div>
      </section>

      {/* VISION */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="font-bold" style={{ color: 'var(--gold-deep, #9d855a)' }}>Vision 2027</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold" style={{ color: ink }}>Every table becomes two.</h2>
          <p className={`mt-4 ${body}`}>
            We&apos;re asking every group of four at Iowa to become two groups of four. Morgan and McKenna are starting studies
            for women and joining our intern leadership training. We&apos;re praying about a prayer room on campus.
          </p>
          <p className={`mt-4 ${body}`}>
            What works at Iowa doesn&apos;t stay there. We&apos;re writing a Trick or Truth field guide so any campus or church
            can do what our students did. And we coach pastors free of charge so their people learn to make disciples too.
            Boulevard was the first church to bring the Daily DNA app into its whole community, and most of the church now
            journals and prays with it every day.
          </p>
          <div className="mt-10">
            <Photo src="/photos/street-prayer.jpg" alt="Travis praying with a student on campus" w={1600} h={1199} />
          </div>
        </div>
      </section>

      {/* GIVE */}
      <section id="give" className="py-16 md:py-20" style={{ background: '#f3efe8' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: ink }}>
            Our ministry runs on {fmt(GOAL)} a month. We&apos;re {fmt(GAP)} short.
          </h2>
          <p className={`mt-4 ${body}`}>
            Your gift sends our family to campus and to the churches we coach. Partners already give {fmt(RAISED)} a month, and
            we&apos;re grateful for every one of you. Some support always ends at the turn of the year, so we need {fmt(GAP)} more
            a month by January to start 2027 at full strength.
          </p>
          <p className={`mt-4 ${body}`}>
            <strong style={{ color: ink }}>Already a partner?</strong> Would you add $25 or $50 a month, or give a year-end gift?
            <br />
            <strong style={{ color: ink }}>New here?</strong> Join the monthly team. Thirty people at $50 a month closes the gap.
          </p>

          <div className="mt-8 bg-white rounded-md border border-[#ddd6ca]">
            <Script src="https://app.donorview.com/scripts/shared/iframeResizer/iframeResizer.min.js" strategy="lazyOnload" />
            <iframe
              src={DONORVIEW_FORM}
              frameBorder="0"
              scrolling="yes"
              id="dv-iframe"
              allow="payment"
              name="dv-iframe"
              className="w-full rounded-md"
              style={{ width: '100%', height: '800px' }}
              title="Give through Global Service Associates"
            />
            <Script id="dv-iframe-resizer" strategy="lazyOnload">
              {`if (typeof iFrameResize !== 'undefined') { iFrameResize({ checkOrigin: false, inPageLinks: true, heightCalculationMethod: 'taggedElement' }, '#dv-iframe'); }`}
            </Script>
          </div>
          <p className="mt-3 text-sm text-[#5b5650]">
            Gifts support Travis and Kimberly Gluckler&apos;s ministry through Global Service Associates, a 501(c)(3), and are tax-deductible.
          </p>

          <p className={`mt-8 ${body}`}>You&apos;ll hear what your gift does: real names and real stories in our updates, like Morgan&apos;s and Keilor&apos;s.</p>
          <p className="mt-4 text-[#3d3a36]">Giving Tuesday is December 1. Our goal that day: 30 new or increased monthly gifts.</p>
        </div>
      </section>
    </div>
  );
}
