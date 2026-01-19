export const metadata = {
  title: 'Get Involved - ARK Identity',
  description: 'Join the ARK Identity team or partner with us as a volunteer, church, or ministry.',
};

export default function GetInvolved() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Get Involved
          </h1>
          <p className="text-xl text-gray-200">
            Join us in multiplying disciples across the nation.
          </p>
        </div>
      </section>

      {/* Careers Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
              Join the Team
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              ARK Identity is a mission-driven, flexible, remote-friendly team. We&apos;re looking for passionate disciple-makers who want to activate transformation in believers.
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--navy)' }}>
            Current Openings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Position 1 */}
            <div className="bg-white border-2 rounded-xl p-8 shadow-sm hover:shadow-md transition" style={{ borderColor: 'var(--gold)' }}>
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
                  University Discipleship Coordinator (Male)
                </h4>
              </div>
              <div className="space-y-3 text-gray-700">
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--gold)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span><strong>Location:</strong> University of Iowa, Iowa City</span>
                </p>
                <p className="text-gray-600">
                  Lead discipleship groups, mentor students, facilitate ARK trainings
                </p>
                <a
                  href="mailto:info@arkidentity.com"
                  className="inline-block mt-4 px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--navy)', color: 'white' }}
                >
                  Apply Now
                </a>
              </div>
            </div>

            {/* Position 2 */}
            <div className="bg-white border-2 rounded-xl p-8 shadow-sm hover:shadow-md transition" style={{ borderColor: 'var(--gold)' }}>
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
                  University Discipleship Coordinator (Female)
                </h4>
              </div>
              <div className="space-y-3 text-gray-700">
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--gold)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span><strong>Location:</strong> University of Iowa, Iowa City</span>
                </p>
                <p className="text-gray-600">
                  Lead discipleship groups, mentor students, facilitate ARK trainings
                </p>
                <a
                  href="mailto:info@arkidentity.com"
                  className="inline-block mt-4 px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--navy)', color: 'white' }}
                >
                  Apply Now
                </a>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 space-y-4">
            <p className="text-gray-600">
              Email your resume to{' '}
              <a href="mailto:info@arkidentity.com" className="font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
                info@arkidentity.com
              </a>
            </p>
            <p className="text-gray-600">
              Student at U of Iowa?{' '}
              <a href="/iowa" className="font-semibold hover:underline" style={{ color: 'var(--gold)' }}>
                Learn about our campus ministry →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 text-center" style={{ color: 'var(--navy)' }}>
            Ministry Partnerships
          </h2>
          <p className="text-lg text-gray-700 mb-12 text-center max-w-3xl mx-auto">
            Partner with us financially or through ministry collaboration. We believe in partnership, not just patronage.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Churches */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--maroon)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center" style={{ color: 'var(--navy)' }}>
                For Churches
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Launch ARK Identity for your congregation. Our DNA system equips your members to make disciples who multiply.
              </p>
              <div className="text-center">
                <a
                  href="https://dna.arkidentity.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
                >
                  Explore DNA for Churches
                </a>
              </div>
            </div>

            {/* For Content Creators */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--head-blue)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center" style={{ color: 'var(--navy)' }}>
                For Content Creators
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Use our resources, co-create courses, and help us reach more believers with the gospel.
              </p>
              <div className="text-center">
                <a
                  href="mailto:info@arkidentity.com"
                  className="inline-block px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--head-blue)', color: 'white' }}
                >
                  Let&apos;s Talk
                </a>
              </div>
            </div>

            {/* For Ministries */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--gold)' }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--navy)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center" style={{ color: 'var(--navy)' }}>
                For Ministries
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Integrate ARK tools into your discipleship strategy. We provide the framework, you provide the community.
              </p>
              <div className="text-center">
                <a
                  href="mailto:info@arkidentity.com"
                  className="inline-block px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
                >
                  Let&apos;s Talk
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
