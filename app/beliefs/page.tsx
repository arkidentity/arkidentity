export const metadata = {
  title: 'What We Believe - ARK Identity',
  description: 'ARK Identity\'s core theological beliefs rooted in Trinitarian Theology.',
};

export default function Beliefs() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            What We Believe
          </h1>
          <p className="text-xl text-gray-200">
            Our theology is rooted in the Bible and the relational nature of the Trinity.
          </p>
        </div>
      </section>

      {/* Opening Statement */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed">
              ARK Identity believes that theology should be rooted in the Bible, especially the New Testament. We see a reliable theology articulated by Irenaeus, Athanasius, Gregory Nazianzus, and more recently, Karl Barth, Thomas F. Torrance, and many others. This theology is often referred to as <strong>Trinitarian Theology</strong> due to its emphasis on the relational nature of the <strong>Father, Son, and Holy Spirit.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Core Beliefs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            Core Beliefs
          </h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: 'var(--navy)' }}>
              <p className="text-gray-700 leading-relaxed">
                The Father, Son, and Spirit are one God, united in love for one another.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: 'var(--navy)' }}>
              <p className="text-gray-700 leading-relaxed">
                Jesus Christ, as the Word made flesh, is fully God and fully human.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: 'var(--navy)' }}>
              <p className="text-gray-700 leading-relaxed">
                Jesus accurately reveals the goodness and love of God, and reveals humanity as God intended us to be.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: 'var(--navy)' }}>
              <p className="text-gray-700 leading-relaxed">
                As our Creator, Jesus represented all humanity, and all people benefit from his vicarious humanity: his life, death, resurrection and ascension. Jesus Christ atoned for all sin and suffered its full consequence.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: 'var(--navy)' }}>
              <p className="text-gray-700 leading-relaxed">
                God has in Christ reconciled all humanity to himself through his son, Jesus (Colossians 1:20). (However, universal atonement should not be equated with universalism.)
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: 'var(--navy)' }}>
              <p className="text-gray-700 leading-relaxed">
                The judgment of God against evil has been executed in Jesus Christ so that all might repent and receive forgiveness and, through the Holy Spirit, share in Christ&apos;s resurrected, eternal life.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: 'var(--navy)' }}>
              <p className="text-gray-700 leading-relaxed">
                People are exhorted to respond to this reconciliation and participate in the life we were all created for.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: 'var(--navy)' }}>
              <p className="text-gray-700 leading-relaxed">
                Jesus, as the intersection of divinity and humanity, has made it possible for humanity to share in the life and love of the Trinity, fulfilling God&apos;s eternal intention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Resource */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
            Want to Learn More?
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            This is an amazing resource that highlights what we believe is most important to the Christian faith.
          </p>
          <a
            href="/We Believe.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 rounded-lg font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download We_Believe.pdf</span>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
