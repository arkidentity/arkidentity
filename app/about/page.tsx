export const metadata = {
  title: 'About - ARK Identity',
  description: 'Learn about ARK Identity\'s mission to help believers experience God daily and churches multiply disciples naturally.',
};

export default function About() {
  return (
    <div style={{ background: '#FAF8F5' }}>
      {/* Hero Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>
            Our Story
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Knowing God and Who<br />God Says You Are
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            We help believers experience God daily and churches multiply disciples naturally.
          </p>
          <div className="w-16 h-1 mx-auto mt-8 rounded-full" style={{ background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
        </div>
      </section>

      {/* Three-Fold Mission */}
      <section className="py-16" style={{ background: '#F5F2EE' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-3 text-center" style={{ color: 'var(--navy)' }}>
            Our Three-Fold Mission
          </h2>
          <p className="text-lg mb-10 text-center" style={{ color: '#5a5247' }}>Why We Exist:</p>

          <div className="space-y-6">
            <div className="p-7 rounded-xl shadow-sm border-l-4" style={{ backgroundColor: '#FFFFFF', borderLeftColor: 'var(--gold)' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                1. To know God and who God says we are
              </h3>
              <p className="italic" style={{ color: '#6b6157' }}>
                &quot;Now this is eternal life: that they know you, the only true God, and Jesus Christ, whom you have sent.&quot; - John 17:3 NIV
              </p>
            </div>

            <div className="p-7 rounded-xl shadow-sm border-l-4" style={{ backgroundColor: '#FFFFFF', borderLeftColor: 'var(--gold)' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                2. To share the Gospel with the next generation
              </h3>
            </div>

            <div className="p-7 rounded-xl shadow-sm border-l-4" style={{ backgroundColor: '#FFFFFF', borderLeftColor: 'var(--gold)' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                3. To make disciples who multiply
              </h3>
              <p className="italic" style={{ color: '#6b6157' }}>
                &quot;And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others.&quot; - 2 Timothy 2:2 NIV
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Do It */}
      <section className="py-16" style={{ background: '#FAF8F5' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            How We Do It
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-xl shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--head-blue)' }}>
                For Individuals
              </h3>
              <p className="mb-4" style={{ color: '#4a4540' }}>Daily activation tools that build spiritual habits:</p>
              <ul className="space-y-2" style={{ color: '#5a5247' }}>
                <li><strong style={{ color: 'var(--navy)' }}>3D Journal</strong> - Scripture journaling through HEAD, HEART, HANDS</li>
                <li><strong style={{ color: 'var(--navy)' }}>4D Prayer</strong> - Guided prayer through REVERE, REFLECT, REQUEST, REST</li>
                <li><strong style={{ color: 'var(--navy)' }}>Creed Cards</strong> - 50 essential theology truths in bite-sized format</li>
                <li><strong style={{ color: 'var(--navy)' }}>ARK Courses</strong> - Video-based discipleship training</li>
                <li><strong style={{ color: 'var(--navy)' }}>3D Bible Challenge</strong> - Gamified daily journaling with streaks and badges</li>
              </ul>
            </div>

            <div className="p-7 rounded-xl shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--maroon)' }}>
                For Churches
              </h3>
              <p className="mb-4" style={{ color: '#4a4540' }}><strong style={{ color: 'var(--navy)' }}>DNA Groups</strong> - A multiplication system where:</p>
              <ul className="space-y-2" style={{ color: '#5a5247' }}>
                <li>Groups of 4 meet weekly (1 leader + 1 co-leader + 2 disciples)</li>
                <li>After 6-12 months, groups multiply</li>
                <li>Churches shift from consumer culture to disciple-making DNA</li>
                <li>Includes church assessment, leader dashboard, and resources</li>
              </ul>
            </div>

            <div className="p-7 rounded-xl shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--gold)' }}>
                For Campus
              </h3>
              <p className="mb-4" style={{ color: '#4a4540' }}><strong style={{ color: 'var(--navy)' }}>University of Iowa Model</strong> (Proof of Concept):</p>
              <ul className="space-y-2 mb-6" style={{ color: '#5a5247' }}>
                <li>Students use ARK tools daily for spiritual formation</li>
                <li>DNA Groups form the core discipleship structure</li>
                <li>Evangelism through Bridge training and campus outreach</li>
                <li>Testing a model designed to scale nationwide</li>
              </ul>
              <a href="/iowa" className="inline-block px-5 py-2.5 rounded-lg font-semibold transition hover:opacity-90 text-sm" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}>
                Join Us at Iowa
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16" style={{ background: '#F5F2EE' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center" style={{ color: 'var(--navy)' }}>
            The Origin Story
          </h2>

          <div className="space-y-8">
            <div className="p-7 rounded-xl shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--gold)' }}>2013-2019: The Beginning</h3>
              <p className="leading-relaxed" style={{ color: '#4a4540' }}>
                Travis Gluckler created ARK Identity in 2013 as God walked him through his own journey of identity in Christ. He developed teachings and activation tools to equip a group of disciples in Las Vegas. Over the years, he refined the curriculum multiple times, renaming the original courses from &quot;ARK 101&quot; and &quot;ARK 102&quot; to &quot;Identity Through The Trinity&quot; and &quot;Freedom.&quot; Many courses followed, building a comprehensive library of discipleship resources.
              </p>
            </div>

            <div className="p-7 rounded-xl shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--gold)' }}>2020-2024: The Pivot</h3>
              <p className="leading-relaxed mb-4" style={{ color: '#4a4540' }}>
                In January 2020, ARK was ready to launch in-person trainings at Encounter Church Las Vegas. Little did Travis know that God had a different plan. The week of the first session was the same week COVID quarantine hit America, and The ARK went LIVE on Zoom instead. What seemed like a huge transition turned out to be a tremendous blessing. Since going online in 2020, ARK hosted trainings for over 1000 students across multiple states.
              </p>
              <p className="leading-relaxed" style={{ color: '#4a4540' }}>
                Although Zoom trainings proved effective, ARK began focusing on in-person weekend workshops where people could experience the gospel in immersive environments.
              </p>
            </div>

            <div className="p-7 rounded-xl shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--gold)' }}>2025-Present: The Product Shift</h3>
              <p className="leading-relaxed mb-4" style={{ color: '#4a4540' }}>
                ARK realized people needed daily activation tools, not just weekly lessons or occasional workshops. We built an app with Scripture journaling, guided prayer, theology education, and discipleship courses. We developed the DNA Groups system for churches to multiply disciples naturally. And we launched campus ministry at the University of Iowa as a proof-of-concept model for reaching and discipling students.
              </p>
              <p className="leading-relaxed font-semibold" style={{ color: 'var(--navy)' }}>
                Today, ARK provides resources for individuals, systems for churches, and a campus model being tested—all designed to activate disciples who multiply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars of ARK */}
      <section className="py-16" style={{ background: '#FAF8F5' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--navy)' }}>
            Pillars of ARK
          </h2>
          <p className="text-lg mb-10 text-center" style={{ color: '#5a5247' }}>
            Our discipleship philosophy rests on three pillars:
          </p>

          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-start p-5 rounded-xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4" style={{ backgroundColor: 'var(--navy)' }}>1</span>
              <span className="text-lg pt-1.5" style={{ color: '#4a4540' }}>To personally hear God&apos;s voice through His word and Spirit</span>
            </div>
            <div className="flex items-start p-5 rounded-xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4" style={{ backgroundColor: 'var(--maroon)' }}>2</span>
              <span className="text-lg pt-1.5" style={{ color: '#4a4540' }}>To know our true identity through experiencing the Trinity</span>
            </div>
            <div className="flex items-start p-5 rounded-xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}>3</span>
              <span className="text-lg pt-1.5" style={{ color: '#4a4540' }}>To be disciples who make disciples</span>
            </div>
          </div>
        </div>
      </section>

      {/* Consider the Impact */}
      <section className="py-16" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--gold)' }}>
            Consider the Impact
          </h2>
          <p className="text-xl mb-6 text-gray-300">What does ARK Identity look like with:</p>
          <ul className="space-y-3 text-lg mb-8 text-gray-200">
            <li>100 ARK-equipped churches around the country?</li>
            <li>1000 DNA Groups multiplying disciples naturally?</li>
            <li>Campus ministries on 50 universities using our model?</li>
          </ul>
          <p className="text-xl font-semibold" style={{ color: 'var(--gold)' }}>
            This is the power of exponential growth in the Body of Christ—shifting entire cultures from consumers to producers.
          </p>
        </div>
      </section>
    </div>
  );
}
