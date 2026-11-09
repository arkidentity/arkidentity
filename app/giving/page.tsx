import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';

export const metadata = {
  title: 'Giving - ARK Identity',
  description: 'Partner with ARK Identity to multiply disciples. Give directly or through our tax-deductible fiscal sponsor.',
};

// Design (human-made-sites skill, 11/8): real tables, real people. The one bold thing is the strip of
// photos from actual ARK moments; everything else stays plain. Tax-deductible (GSA) giving comes first
// because most partners want a receipt. Site audit: docs/planning/site-audit-2026-11-08.md.
const MOMENTS: [string, string][] = [
  ['/photos/church-hall-students.jpg', 'With students after church'],
  ['/photos/street-prayer.jpg', 'Praying with a student on campus'],
  ['/photos/home-gathering.jpg', 'A gathering in a home'],
  ['/photos/campus-lunch.jpg', 'Lunch on campus'],
];

export default function Giving() {
  return (
    <div className="bg-white">
      {/* HERO: clear photo, words on a solid band */}
      <section>
        <div className="relative h-[42vh] md:h-[60vh] bg-[#1a2b3c]">
          <Image src="/photos/iowa-table.jpg" alt="ARK Iowa students around a table" fill priority sizes="100vw" className="object-cover object-[center_60%]" />
        </div>
        <div style={{ background: 'var(--navy)' }} className="text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 md:flex md:items-end md:justify-between md:gap-10">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold leading-[1.05]">Invest in what multiplies.</h1>
              <p className="mt-4 text-lg md:text-xl text-[#d9dde2]">Disciples who make disciples, around real tables, one person at a time.</p>
            </div>
            <a href="#give" className="mt-6 md:mt-0 inline-block w-full md:w-auto text-center px-8 py-4 rounded-md font-semibold text-lg transition hover:brightness-105" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}>
              Give
            </a>
          </div>
        </div>
      </section>

      {/* THE QUESTION */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="max-w-xl text-lg md:text-xl leading-relaxed text-[#3d3a36]">
            You want to invest in people. You give generously to ministries, but deep down you wonder: is this producing
            real life change? Are we creating disciples who make disciples, or just funding programs that fill seats?
          </p>
          <p className="mt-10 md:ml-[30%] max-w-3xl text-3xl md:text-5xl font-bold leading-tight" style={{ color: 'var(--navy)' }}>
            If you want to invest in something that multiplies, not just maintains, you&apos;re not alone.
          </p>
        </div>
      </section>

      {/* WHAT YOUR GIFT LOOKS LIKE: the photo strip */}
      <section className="pb-16 md:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {MOMENTS.map(([src, caption]) => (
            <figure key={src} className="relative">
              <div className="relative aspect-[4/5]">
                <Image src={src} alt={caption} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
              </div>
              <figcaption className="px-3 py-2 text-sm text-[#5b5650]">{caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* GIVE */}
      <section id="give" className="py-16 md:py-20" style={{ background: '#f3efe8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold max-w-2xl" style={{ color: 'var(--navy)' }}>Two ways to give</h2>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 items-start">
            <div>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>Tax-deductible</h3>
              <p className="mt-2 text-[#3d3a36]">
                Through our fiscal sponsor, Global Service Associates, a 501(c)(3). You&apos;ll get a tax receipt.
              </p>
              <div className="mt-5 bg-white rounded-md border border-[#ddd6ca]">
                <Script
                    src="https://app.donorview.com/scripts/shared/iframeResizer/iframeResizer.min.js"
                    strategy="lazyOnload"
                  />
                  <iframe
                    src="https://app.dvforms.net/api/dv/zkyz4k"
                    frameBorder="0"
                    scrolling="yes"
                    id="dv-iframe"
                    allow="payment"
                    name="dv-iframe"
                    className="w-full rounded-md"
                    style={{ width: '100%', height: '800px' }}
                    title="Tax-Deductible Giving via Global Service Associates"
                  />
                  <Script id="dv-iframe-resizer" strategy="lazyOnload">
                    {`
                      if (typeof iFrameResize !== 'undefined') {
                        iFrameResize({
                          checkOrigin: false,
                          inPageLinks: true,
                          heightCalculationMethod: 'taggedElement'
                        }, '#dv-iframe');
                      }
                    `}
                  </Script>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>Give to ARK directly</h3>
              <p className="mt-2 text-[#3d3a36]">
                Goes straight to development, hosting and content. <strong>Not tax-deductible.</strong>
              </p>
              <div className="mt-5 bg-white rounded-md border border-[#ddd6ca]">
                <iframe
                  src="https://checkout.square.site/merchant/MLC3G13NXWEVC/checkout/KF3JBKCHDFBPSV32MKF62UU3"
                  className="w-full rounded-md"
                  style={{ height: '800px' }}
                  title="Direct Giving via Square"
                />
              </div>
            </div>
          </div>
          <p className="mt-12 text-lg text-[#3d3a36]">
            Want to see where it goes?{' '}
            <Link href="/vision-2026" className="font-semibold underline" style={{ color: 'var(--navy)' }}>Read Vision 2026</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
