export const metadata = {
  title: 'About - ARK Identity',
  description: 'Learn about ARK Identity\'s mission to help believers experience God daily and churches multiply disciples naturally.',
};

export default function About() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Our Story
          </h1>
          <p className="text-xl text-gray-200 leading-relaxed">
            We help believers experience God daily and churches multiply disciples naturally.
          </p>
        </div>
      </section>

      {/* Three-Fold Mission */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--navy)' }}>
            Our Three-Fold Mission
          </h2>
          <p className="text-lg mb-8 text-center text-gray-700">Why We Exist:</p>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                1. To know God and who God says we are
              </h3>
              <p className="text-gray-600 italic">
                &quot;Now this is eternal life: that they know you, the only true God, and Jesus Christ, whom you have sent.&quot; - John 17:3 NIV
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                2. To share the Gospel with the next generation
              </h3>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                3. To make disciples who multiply
              </h3>
              <p className="text-gray-600 italic">
                &quot;And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others.&quot; - 2 Timothy 2:2 NIV
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Do It */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: 'var(--navy)' }}>
            How We Do It
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Individuals */}
            <div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--head-blue)' }}>
                For Individuals
              </h3>
              <p className="text-gray-700 mb-4">Daily activation tools that build spiritual habits:</p>
              <ul className="space-y-2 text-gray-600">
                <li><strong>3D Journal</strong> - Scripture journaling through HEAD (Information), HEART (Transformation), HANDS (Activation)</li>
                <li><strong>4D Prayer</strong> - Guided prayer experiences through REVERE, REFLECT, REQUEST, REST</li>
                <li><strong>Creed Cards</strong> - 50 essential theology truths in bite-sized format</li>
                <li><strong>ARK Courses</strong> - Video-based discipleship training (including The Bridge evangelism course)</li>
                <li><strong>3D Bible Challenge</strong> - Gamified daily journaling with streaks, badges, and community</li>
              </ul>
            </div>

            {/* For Churches */}
            <div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--maroon)' }}>
                For Churches
              </h3>
              <p className="text-gray-700 mb-4"><strong>DNA Groups</strong> - A multiplication system where:</p>
              <ul className="space-y-2 text-gray-600">
                <li>Groups of 4 meet weekly (1 leader + 1 co-leader + 2 disciples)</li>
                <li>After 6-12 months, groups multiply (co-leader becomes leader of new group)</li>
                <li>Churches shift from consumer culture to disciple-making DNA</li>
                <li>Includes church assessment, leader dashboard, and implementation resources</li>
              </ul>
            </div>

            {/* For Campus */}
            <div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--gold)' }}>
                For Campus
              </h3>
              <p className="text-gray-700 mb-4"><strong>University of Iowa Model</strong> (Proof of Concept):</p>
              <ul className="space-y-2 text-gray-600">
                <li>Students use ARK tools daily for spiritual formation</li>
                <li>DNA Groups form the core discipleship structure</li>
                <li>Evangelism through Bridge training and campus outreach</li>
                <li>Testing a model designed to scale to campuses nationwide</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--navy)' }}>
            The Origin Story
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                2013-2019: The Beginning
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Travis Gluckler created ARK Identity in 2013 as God walked him through his own journey of identity in Christ. He developed teachings and activation tools to equip a group of disciples in Las Vegas. Over the years, he refined the curriculum multiple times, renaming the original courses from &quot;ARK 101&quot; and &quot;ARK 102&quot; to &quot;Identity Through The Trinity&quot; and &quot;Freedom.&quot; Many courses followed, building a comprehensive library of discipleship resources.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                2020-2024: The Pivot
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In January 2020, ARK was ready to launch in-person trainings at Encounter Church Las Vegas. Little did Travis know that God had a different plan. The week of the first session was the same week COVID quarantine hit America, and The ARK went LIVE on Zoom instead. What seemed like a huge transition turned out to be a tremendous blessing. Since going online in 2020, ARK hosted trainings for over 1000 students across multiple states.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Although Zoom trainings proved effective, ARK began focusing on in-person weekend workshops where people could experience the gospel in immersive environments.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                2025-Present: The Product Shift
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                ARK realized people needed daily activation tools, not just weekly lessons or occasional workshops. We built an app with Scripture journaling, guided prayer, theology education, and discipleship courses. We developed the DNA Groups system for churches to multiply disciples naturally. And we launched campus ministry at the University of Iowa as a proof-of-concept model for reaching and discipling students.
              </p>
              <p className="text-gray-700 leading-relaxed font-semibold">
                Today, ARK provides resources for individuals, systems for churches, and a campus model being tested—all designed to activate disciples who multiply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars of ARK */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--navy)' }}>
            Pillars of ARK
          </h2>
          <p className="text-lg text-gray-700 mb-8 text-center">
            Our discipleship philosophy rests on three pillars:
          </p>

          <ol className="space-y-4 text-lg text-gray-700">
            <li className="flex items-start">
              <span className="font-bold mr-3" style={{ color: 'var(--navy)' }}>1.</span>
              <span>To personally hear God&apos;s voice through His word and Spirit</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-3" style={{ color: 'var(--navy)' }}>2.</span>
              <span>To know our true identity through experiencing the Trinity</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-3" style={{ color: 'var(--navy)' }}>3.</span>
              <span>To be disciples who make disciples</span>
            </li>
          </ol>
        </div>
      </section>

      {/* Consider the Impact */}
      <section className="py-16" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--gold)' }}>
            Consider the Impact
          </h2>
          <p className="text-xl mb-6">What does ARK Identity look like with:</p>
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
