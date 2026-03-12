export const metadata = {
  title: 'What We Believe - ARK Identity',
  description: 'ARK Identity\'s core theological beliefs rooted in Trinitarian Theology.',
};

export default function Beliefs() {
  return (
    <div style={{ background: '#FAF8F5' }}>
      {/* Hero Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>
            Our Foundation
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            What We Believe
          </h1>
          <p className="text-xl text-gray-300">
            Our theology is rooted in the Bible and the relational nature of the Trinity.
          </p>
          <div className="w-16 h-1 mx-auto mt-8 rounded-full" style={{ background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
        </div>
      </section>

      {/* Opening Statement */}
      <section className="py-16" style={{ background: '#FAF8F5' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-lg leading-relaxed" style={{ color: '#4a4540' }}>
              ARK Identity believes that theology should be rooted in the Bible, especially the New Testament. We see a reliable theology articulated by Irenaeus, Athanasius, Gregory Nazianzus, and more recently, Karl Barth, Thomas F. Torrance, and many others. This theology is often referred to as <strong style={{ color: 'var(--navy)' }}>Trinitarian Theology</strong> due to its emphasis on the relational nature of the <strong style={{ color: 'var(--navy)' }}>Father, Son, and Holy Spirit.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Core Beliefs */}
      <section className="py-16" style={{ background: '#F5F2EE' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            Core Beliefs
          </h2>

          <div className="space-y-5">
            {[
              'The Father, Son, and Spirit are one God, united in love for one another.',
              'Jesus Christ, as the Word made flesh, is fully God and fully human.',
              'Jesus accurately reveals the goodness and love of God, and reveals humanity as God intended us to be.',
              'As our Creator, Jesus represented all humanity, and all people benefit from his vicarious humanity: his life, death, resurrection and ascension. Jesus Christ atoned for all sin and suffered its full consequence.',
              'God has in Christ reconciled all humanity to himself through his son, Jesus (Colossians 1:20). (However, universal atonement should not be equated with universalism.)',
              'The judgment of God against evil has been executed in Jesus Christ so that all might repent and receive forgiveness and, through the Holy Spirit, share in Christ\u2019s resurrected, eternal life.',
              'People are exhorted to respond to this reconciliation and participate in the life we were all created for.',
              'Jesus, as the intersection of divinity and humanity, has made it possible for humanity to share in the life and love of the Trinity, fulfilling God\u2019s eternal intention.',
            ].map((belief, i) => (
              <div key={i} className="p-6 rounded-xl border-l-4" style={{ backgroundColor: '#FFFFFF', borderLeftColor: 'var(--gold)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p className="leading-relaxed" style={{ color: '#4a4540' }}>{belief}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Resource */}
      <section className="py-16" style={{ background: '#FAF8F5' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
            Want to Learn More?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#5a5247' }}>
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
