import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      {/* Hero Section - Asymmetric Split */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            {/* Left Side - Text & CTAs (60%) */}
            <div className="lg:col-span-3 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: 'var(--navy)' }}>
                Discipleship Tools That Naturally Multiply
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                We help believers experience God daily and churches multiply disciples naturally.
              </p>

              {/* Two Main CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href="https://app.arkidentity.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-lg font-semibold text-lg text-center transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--navy)', color: 'white' }}
                >
                  For Individuals
                </a>
                <a
                  href="https://dna.arkidentity.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-lg font-semibold text-lg text-center transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
                >
                  For Churches
                </a>
              </div>
            </div>

            {/* Right Side - Visual (40%) */}
            <div className="lg:col-span-2">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/images/screenshot_3djournal.png"
                  alt="ARK App - 3D Journal"
                  width={800}
                  height={800}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer - 2 Cards */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: For Individuals */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--head-blue)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                  For Individuals
                </h3>
                <p className="text-gray-600 mb-6">
                  Scripture journaling, guided prayer, theology courses, and community challenges—all in one app.
                </p>
                <a
                  href="https://app.arkidentity.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--head-blue)', color: 'white' }}
                >
                  Get the App
                </a>
              </div>
            </div>

            {/* Card 2: For Churches */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="aspect-video bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center p-8">
                <Image
                  src="/images/dna-logo-dark.png"
                  alt="DNA System Logo"
                  width={300}
                  height={200}
                  className="w-auto h-32 object-contain"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                  For Churches
                </h3>
                <p className="text-gray-600 mb-6">
                  Life-on-life discipleship groups that multiply every 6-12 months. Move from consumer culture to disciple-making DNA.
                </p>
                <a
                  href="https://dna.arkidentity.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
                >
                  Explore DNA
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Ministry Callout - Full Bleed */}
      <section className="relative py-24" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
           The ARK at Iowa
          </h2>
          <p className="text-lg md:text-xl mb-8 text-gray-200">
            Disicplship at University of Iowa—students using ARK tools daily + DNA Groups for multiplication. What happens when the next generation encounters Jesus through tools that actually works.
          </p>
          <Link
            href="/iowa"
            className="inline-block px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
          >
            Join Us at Iowa
          </Link>
        </div>
      </section>

      {/* Three-Fold Mission */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: 'var(--navy)' }}>
            Our Mission
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--head-blue)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                Know God and our identity in Christ
              </h3>
              <p className="text-gray-600 italic">
                Through daily spiritual formation tools
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--heart-red)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                Share the Gospel with the next generation
              </h3>
              <p className="text-gray-600 italic">
                Through campus ministry and evangelism training
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--hands-gold)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                Make disciples who multiply
              </h3>
              <p className="text-gray-600 italic">
                Through the DNA multiplication system
              </p>
            </div>
          </div>

          <p className="text-center text-lg mt-12 font-semibold" style={{ color: 'var(--navy)' }}>
            We create resources that activate transformation—not just information.
          </p>
        </div>
      </section>

      {/* Vision 2026 Callout - Gradient Banner */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--maroon) 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--gold)' }}>
            Where We're Headed in 2026
          </h2>
          <p className="text-lg mb-8 text-gray-200">
            Launching full-time campus ministry at U of Iowa, scaling the ARK app nationwide, and partnering with churches to multiply disciples.
          </p>
          <Link
            href="/vision-2026"
            className="inline-block px-8 py-3 rounded-lg font-semibold transition hover:opacity-90"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
          >
            See Vision 2026
          </Link>
        </div>
      </section>
    </>
  );
}
