import Link from 'next/link';

export const metadata = {
  title: 'Vision 2026 - ARK Identity',
  description: 'Our vision for 2026: Launch campus ministry, scale app adoption, and multiply disciples nationwide.',
};

export default function Vision2026() {
  return (
    <div className="bg-white">
      {/* Hero Section with Video Placeholder */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center text-white">
            Vision 2026
          </h1>
          <p className="text-xl text-gray-200 mb-8 text-center">
            Your Partnership Empowers Us To...
          </p>

          {/* Vision 2026 Video */}
          <iframe
            className="w-full aspect-video rounded-xl"
            src="https://www.youtube.com/embed/FFMX4J9mGVY"
            title="VISION 2026: Addition vs Multiplication"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* The Three Goals */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            The Three Goals
          </h2>

          <div className="space-y-12">
            {/* Goal 1 */}
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--gold)' }}>
                Goal 1: Launch Campus Ministry at U of Iowa
              </h3>
              <p className="text-lg mb-4 font-semibold text-gray-700">By Fall 2026:</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--gold)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  30-50 Student Disciples
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--gold)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  12+ Student Leaders
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--gold)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Hire 2 Campus Coordinators (1 male, 1 female)
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--gold)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Establish DNA Groups as core campus discipleship model
                </li>
              </ul>
            </div>

            {/* Goal 2 */}
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--head-blue)' }}>
                Goal 2: Scale ARK App + DNA System
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-lg mb-4 font-semibold text-gray-700">App Growth:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--head-blue)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      1,000+ daily active users
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--head-blue)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      100+ believers completing 100-day challenge streaks
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--head-blue)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Launch virtual 24/7 Prayer Room as regular-use feature
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-lg mb-4 font-semibold text-gray-700">DNA Church Partnerships:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--maroon)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Partner with 3 churches for full DNA implementation
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--maroon)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Build leader dashboard for tracking group multiplication
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--maroon)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Support existing DNA communities nationwide
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Goal 3 */}
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--maroon)' }}>
                Goal 3: Expand Product Offerings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-lg mb-4 font-semibold text-gray-700">New Resources:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--maroon)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Release DNA Manual (for group leaders)
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--maroon)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Release Halloween Evangelism Guide
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--maroon)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Release Marriage Course
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--maroon)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Launch ARK Journal (quarterly physical journal)
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-lg mb-4 font-semibold text-gray-700">Missions:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--maroon)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      1 Global Mission (leading disciples internationally)
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--maroon)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      2-3 Bridge Missions (domestic evangelism training)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Do It */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--navy)' }}>
            How We Do It
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--head-blue)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--navy)' }}>
                Spiritual Formation
              </h3>
              <p className="text-gray-600 text-sm">
                Daily tools that help believers experience God
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--heart-red)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--navy)' }}>
                Evangelism Training
              </h3>
              <p className="text-gray-600 text-sm">
                Bridge course and campus outreach
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--hands-gold)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--navy)' }}>
                Life-on-Life Multiplication
              </h3>
              <p className="text-gray-600 text-sm">
                DNA Groups that naturally multiply
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold mb-4" style={{ color: 'var(--navy)' }}>
              The Tools We Provide:
            </p>
            <p className="text-gray-700">
              ARK App (journal, prayer, courses, challenge) • DNA System (church assessment, groups, leader resources) • Campus Model (University of Iowa as proof of concept)
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-xl shadow-lg border-l-4" style={{ borderLeftColor: 'var(--gold)' }}>
            <div className="mb-4">
              <svg className="w-12 h-12 opacity-20" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gold)' }}>
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <p className="text-xl text-gray-700 italic mb-6 leading-relaxed">
              &quot;The Ark has shifted the culture of our church from the consumer mentality to being a priesthood of believers. If you partner with Ark Identity, it will not only change you, but it will help you make faithful disciples and be a spirit-led family of people who live on mission.&quot;
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold" style={{ color: 'var(--navy)' }}>
                  Pastor Michael Winakur
                </p>
                <p className="text-gray-600">Cross Culture Church, Denver</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-center text-lg font-semibold mb-4" style={{ color: 'var(--navy)' }}>
              Watch the powerful story of multiplication at Cross Culture Church
            </p>
            <iframe
              className="w-full aspect-video rounded-xl"
              src="https://www.youtube.com/embed/njMFpy2vEgE"
              title="Cross Culture Church Testimony"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 text-center" style={{ color: 'var(--navy)' }}>
            2 Full-Time Leaders. 12 Volunteers. Imagine 100.
          </h2>
          <p className="text-lg text-gray-700 mb-12 text-center max-w-3xl mx-auto">
            Travis and Kimberly lead ARK full-time. These 12 volunteer leaders run DNA Groups, teach courses, and multiply disciples in their communities—while working full-time jobs. Vision 2026: Add 2 paid campus coordinators and scale this model nationwide.
          </p>

          {/* Full-Time Leadership */}
          <div className="mb-12">
            <h3 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--gold)' }}>
              Full-Time Leadership
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--gold)' }}>
                <p className="font-bold text-lg" style={{ color: 'var(--navy)' }}>
                  Travis Gluckler
                </p>
                <p className="text-sm" style={{ color: 'var(--navy)' }}>
                  Founder & National Director
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--navy)' }}>
                  Iowa City, IA
                </p>
              </div>
              <div className="p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--gold)' }}>
                <p className="font-bold text-lg" style={{ color: 'var(--navy)' }}>
                  Kimberly Gluckler
                </p>
                <p className="text-sm" style={{ color: 'var(--navy)' }}>
                  Network Administrator
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--navy)' }}>
                  Iowa City, IA
                </p>
              </div>
            </div>
          </div>

          {/* Volunteer Leaders */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--navy)' }}>
              Volunteer Leaders
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Sy Ruiz
                </p>
                <p className="text-xs text-gray-600">Aurora/Denver, CO</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Monic Ruiz-Blanco
                </p>
                <p className="text-xs text-gray-600">Denver, CO</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Melissa Ruiz
                </p>
                <p className="text-xs text-gray-600">Aurora/Denver, CO</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Leah Jennings
                </p>
                <p className="text-xs text-gray-600">Las Vegas, NV</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Baruky Ruiz
                </p>
                <p className="text-xs text-gray-600">Denver, CO</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  David Pinto
                </p>
                <p className="text-xs text-gray-600">Loveland, CO</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Alec Schubele
                </p>
                <p className="text-xs text-gray-600">Parker/Aurora, CO</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Adrian Sanchez
                </p>
                <p className="text-xs text-gray-600">Iowa City, IA</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Bob Sandberg
                </p>
                <p className="text-xs text-gray-600">Denver, CO</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Amy Baker
                </p>
                <p className="text-xs text-gray-600">Denver, CO</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Josiah Rognmoe
                </p>
                <p className="text-xs text-gray-600">Parker/Aurora, CO</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                  Mandi Mullin
                </p>
                <p className="text-xs text-gray-600">Denver, CO</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Giving CTA */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--maroon) 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Be part of the mission. Partner with us to launch this vision.
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--gold)' }}>
            Tax-deductible giving available via Global Service Associates (501c3)
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/giving"
              className="px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
            >
              Become A Monthly Partner
            </Link>
            <Link
              href="/giving"
              className="px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90 bg-white"
              style={{ color: 'var(--navy)' }}
            >
              Give A Single Gift
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
