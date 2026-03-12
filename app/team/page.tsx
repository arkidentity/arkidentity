import Image from 'next/image';

export const metadata = {
  title: 'Team - ARK Identity',
  description: 'Meet the ARK Identity team: leadership, advisory board, and volunteer leaders across the nation.',
};

export default function Team() {
  return (
    <div style={{ background: '#FAF8F5' }}>
      {/* Hero Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>
            Our People
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Meet the Team
          </h1>
          <p className="text-xl text-gray-300">
            Led by God, powered by people who believe disciples multiply.
          </p>
          <div className="w-16 h-1 mx-auto mt-8 rounded-full" style={{ background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-16" style={{ background: '#FAF8F5' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            Leadership
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="text-center p-8 rounded-xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden" style={{ border: '3px solid var(--gold)' }}>
                <Image src="/images/travis.JPG" alt="Travis Gluckler" width={192} height={192} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Travis Gluckler</h3>
              <p className="text-lg italic" style={{ color: 'var(--gold)' }}>Founder & National Director</p>
            </div>

            <div className="text-center p-8 rounded-xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden" style={{ border: '3px solid var(--gold)' }}>
                <Image src="/images/kimberly.jpg" alt="Kimberly Gluckler" width={192} height={192} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Kimberly Gluckler</h3>
              <p className="text-lg italic" style={{ color: 'var(--gold)' }}>Network Administrator</p>
            </div>
          </div>
        </div>
      </section>

      {/* Advisory Board Section */}
      <section className="py-16" style={{ background: '#F5F2EE' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            Advisory Board
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Sy Ruiz', role: 'Wise Counsel/Denver, CO' },
              { name: 'Bob Sandberg', role: 'Pastoral Care/Denver, CO' },
              { name: 'Michael Winakur', role: 'Content and Counsel/Denver, CO' },
              { name: 'Vince Antonucci', role: 'Content and Counsel/Las Vegas, NV' },
            ].map((member) => (
              <div key={member.name} className="p-6 rounded-xl border-l-4" style={{ backgroundColor: '#FFFFFF', borderLeftColor: 'var(--gold)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>{member.name}</h3>
                <p className="italic" style={{ color: '#6b6157' }}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Leaders Section */}
      <section className="py-16" style={{ background: '#FAF8F5' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 text-center" style={{ color: 'var(--navy)' }}>
            Volunteer Leaders
          </h2>
          <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: '#5a5247' }}>
            These faithful volunteers run DNA Groups, teach courses, and multiply disciples in their communities—while working full-time jobs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Sy Ruiz', loc: 'Aurora/Denver, CO' },
              { name: 'Monic Ruiz-Blanco', loc: 'Denver, CO' },
              { name: 'Melissa Ruiz', loc: 'Aurora/Denver, CO' },
              { name: 'Leah Jennings', loc: 'Las Vegas, NV' },
              { name: 'Baruky Ruiz', loc: 'Denver, CO' },
              { name: 'David Pinto', loc: 'Loveland, CO' },
              { name: 'Alec Schubele', loc: 'Parker/Aurora, CO' },
              { name: 'Adrian Sanchez', loc: 'Iowa City, IA' },
              { name: 'Bob Sandberg', loc: 'Denver, CO' },
              { name: 'Amy Baker', loc: 'Denver, CO' },
              { name: 'Josiah Rognmoe', loc: 'Parker/Aurora, CO' },
              { name: 'Mandi Mullin', loc: 'Denver, CO' },
            ].map((v) => (
              <div key={v.name} className="flex items-center space-x-3 p-4 rounded-xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--gold)' }} />
                <div>
                  <p className="font-semibold" style={{ color: 'var(--navy)' }}>{v.name}</p>
                  <p className="text-sm" style={{ color: '#6b6157' }}>{v.loc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
