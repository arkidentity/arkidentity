import Image from 'next/image';

export const metadata = {
  title: 'Team - ARK Identity',
  description: 'Meet the ARK Identity team: leadership, advisory board, and volunteer leaders across the nation.',
};

export default function Team() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Meet the Team
          </h1>
          <p className="text-xl text-gray-200">
            Led by God, powered by people who believe disciples multiply.
          </p>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            Leadership
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Travis Gluckler */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                <Image
                  src="/images/travis.JPG"
                  alt="Travis Gluckler"
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
                Travis Gluckler
              </h3>
              <p className="text-lg text-gray-600 italic">Founder & National Director</p>
            </div>

            {/* Kimberly Gluckler */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                <Image
                  src="/images/kimberly.jpg"
                  alt="Kimberly Gluckler"
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
                Kimberly Gluckler
              </h3>
              <p className="text-lg text-gray-600 italic">Network Administrator</p>
            </div>
          </div>
        </div>
      </section>

      {/* Advisory Board Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            Advisory Board
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
                Sy Ruiz
              </h3>
              <p className="text-gray-600 italic">Wise Counsel/Denver, CO</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
                Bob Sandberg
              </h3>
              <p className="text-gray-600 italic">Pastoral Care/Denver, CO</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
                Michael Winakur
              </h3>
              <p className="text-gray-600 italic">Content and Counsel/Denver, CO</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
                Vince Antonucci
              </h3>
              <p className="text-gray-600 italic">Content and Counsel/Las Vegas, NV</p>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Leaders Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--navy)' }}>
            Volunteer Leaders
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            These faithful volunteers run DNA Groups, teach courses, and multiply disciples in their communities—while working full-time jobs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Sy Ruiz</p>
                <p className="text-sm text-gray-600">Aurora/Denver, CO</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Monic Ruiz-Blanco</p>
                <p className="text-sm text-gray-600">Denver, CO</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Melissa Ruiz</p>
                <p className="text-sm text-gray-600">Aurora/Denver, CO</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Leah Jennings</p>
                <p className="text-sm text-gray-600">Las Vegas, NV</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Baruky Ruiz</p>
                <p className="text-sm text-gray-600">Denver, CO</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>David Pinto</p>
                <p className="text-sm text-gray-600">Loveland, CO</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Alec Schubele</p>
                <p className="text-sm text-gray-600">Parker/Aurora, CO</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Adrian Sanchez</p>
                <p className="text-sm text-gray-600">Iowa City, IA</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Bob Sandberg</p>
                <p className="text-sm text-gray-600">Denver, CO</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Amy Baker</p>
                <p className="text-sm text-gray-600">Denver, CO</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Josiah Rognmoe</p>
                <p className="text-sm text-gray-600">Parker/Aurora, CO</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }}></div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>Mandi Mullin</p>
                <p className="text-sm text-gray-600">Denver, CO</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
