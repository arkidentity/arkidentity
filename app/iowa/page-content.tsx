'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function IowaPageContent() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gatherings: [] as string[],
    bringing: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formMessage, setFormMessage] = useState('');

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      gatherings: prev.gatherings.includes(value)
        ? prev.gatherings.filter(g => g !== value)
        : [...prev.gatherings, value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');

    try {
      const response = await fetch('/api/campus-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormStatus('success');
        setFormMessage("Thanks! We'll be in touch with details for this week's gathering.");
        setFormData({
          name: '',
          phone: '',
          email: '',
          gatherings: [],
          bringing: '',
          message: '',
        });
      } else {
        setFormStatus('error');
        setFormMessage('Something went wrong. Please email iowa@arkidentity.com directly.');
      }
    } catch (error) {
      setFormStatus('error');
      setFormMessage('Something went wrong. Please email iowa@arkidentity.com directly.');
    }
  };

  const scrollToRSVP = () => {
    document.getElementById('rsvp')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* SECTION 1: HERO */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
          {/* TODO: Replace with actual campus photo */}
          <div className="absolute inset-0 bg-black opacity-40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            From Distracted to Devoted
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Weekly gatherings and daily tools to help you follow Jesus in college and beyond.
          </p>
          <button
            onClick={scrollToRSVP}
            className="px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
          >
            RSVP to Join Us
          </button>
        </div>
      </section>

      {/* SECTION 2: MEETING TIMES */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: 'var(--navy)' }}>
            Join Us at Iowa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Tuesday Nights */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition border border-gray-100">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--head-blue)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                  Tuesday Nights - Campus Service
                </h3>
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--maroon)' }}>
                  Tuesdays 7:30pm
                </p>
                <p className="text-gray-600 mb-4">
                  Geneva at Old Brick<br />
                  26 E Market St.<br />
                  (Entrance off Clinton St.)
                </p>
                <p className="text-gray-700">
                  Worship, prayer, teaching, community. Our main weekly gathering for all students.
                </p>
              </div>
            </div>

            {/* Card 2: Thursday Nights */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition border border-gray-100">
              <div className="aspect-video bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--heart-red)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                  Thursday Nights - Discipleship Groups
                </h3>
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--maroon)' }}>
                  Thursdays 6:30pm
                </p>
                <p className="text-gray-600 mb-4">
                  Burge Dining Hall<br />
                  (RSVP for more info)
                </p>
                <p className="text-gray-700">
                  Dinner + small groups of 4. Life-on-life discipleship where you learn to hear God and follow Jesus daily.
                </p>
              </div>
            </div>

            {/* Card 3: Start Your Own Group */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition border border-gray-100">
              <div className="aspect-video bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--hands-gold)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                  Start Your Own Group
                </h3>
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--maroon)' }}>
                  Any day/time that works
                </p>
                <p className="text-gray-600 mb-4">
                  Your schedule
                </p>
                <p className="text-gray-700">
                  We'll help you gather 3-4 students and give you resources to lead a discipleship group.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: WHAT WE DO */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8" style={{ color: 'var(--navy)' }}>
            What is ARK Identity?
          </h2>

          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              ARK Identity equips students to follow Jesus daily through discipleship groups and practical devotional tools. We help you hear God's voice, discover your identity in Christ, and build spiritual habits that actually stick through college and beyond.
            </p>

            <p>
              We use a discipleship multiplication system called DNA Groups—small groups of 4 students who meet weekly to follow Jesus together. You'll learn to hear God through Scripture journaling, pray together, share life, and grow in your faith. After 6-12 months, you'll be ready to help lead a new group—because disciples make disciples.
            </p>

            <p>
              Daily, you'll use the ARK app for Scripture journaling (3D Journal), guided prayer (4D Prayer), and theology courses that ground you in who God says you are.
            </p>
          </div>

          <div className="text-center mt-8">
            <a
              href="/about"
              className="inline-block px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              Learn More About ARK
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 4: WHAT TO EXPECT */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: 'var(--navy)' }}>
            Your First Meeting
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: 'var(--navy)' }}>
                1
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                Show Up
              </h3>
              <p className="text-gray-700">
                Tuesdays 7:30pm at Geneva at Old Brick. Bring yourself (Bible optional, we provide one).
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: 'var(--maroon)' }}>
                2
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                Meet the Crew
              </h3>
              <p className="text-gray-700">
                We'll grab food, introduce you around, answer questions. No pressure, no weird rituals.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: 'var(--head-blue)' }}>
                3
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                Experience a Discipleship Group
              </h3>
              <p className="text-gray-700">
                See how we journal through Scripture, pray together, hear what God's doing in each other's lives.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}>
                4
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                Decide if You're In
              </h3>
              <p className="text-gray-700">
                Join a discipleship group, download the ARK app, commit to weekly meetings + daily journaling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: RSVP FORM */}
      <section id="rsvp" className="bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
              Reserve Your Spot
            </h2>
            <p className="text-lg text-gray-600">
              We'd love to save you a seat. Let us know you're coming.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                required
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                required
                placeholder="(555) 555-5555"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>

            {/* Gatherings */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--navy)' }}>
                Which gathering(s) are you interested in? *
              </label>
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    value="Tuesday Nights (Campus Service)"
                    checked={formData.gatherings.includes('Tuesday Nights (Campus Service)')}
                    onChange={(e) => handleCheckboxChange(e.target.value)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span className="ml-3 text-gray-700">Tuesday Nights (Campus Service)</span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    value="Thursday Nights (Discipleship Groups)"
                    checked={formData.gatherings.includes('Thursday Nights (Discipleship Groups)')}
                    onChange={(e) => handleCheckboxChange(e.target.value)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span className="ml-3 text-gray-700">Thursday Nights (Discipleship Groups)</span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    value="Start My Own Group"
                    checked={formData.gatherings.includes('Start My Own Group')}
                    onChange={(e) => handleCheckboxChange(e.target.value)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span className="ml-3 text-gray-700">Start My Own Group</span>
                </label>
              </div>
            </div>

            {/* Bringing */}
            <div>
              <label htmlFor="bringing" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                Who are you bringing?
              </label>
              <input
                type="text"
                id="bringing"
                placeholder="Friend's name (optional)"
                value={formData.bringing}
                onChange={(e) => setFormData({ ...formData, bringing: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                Questions or Message
              </label>
              <textarea
                id="message"
                rows={4}
                placeholder="Any questions for us? (optional)"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formStatus === 'loading'}
              className="w-full px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
            >
              {formStatus === 'loading' ? 'Sending...' : 'RSVP Now'}
            </button>

            {/* Status Messages */}
            {formStatus === 'success' && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-green-800 text-center">{formMessage}</p>
              </div>
            )}

            {formStatus === 'error' && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-800 text-center">{formMessage}</p>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* SECTION 6: QUICK INFO FOOTER */}
      <section className="bg-white py-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Column 1: What We Believe */}
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
                What We Believe
              </h3>
              <p className="text-gray-700 mb-4">
                We're rooted in historic Christian orthodoxy—Trinitarian, Bible-centered, grace-focused.
              </p>
              <a
                href="/beliefs"
                className="text-navy font-semibold hover:text-maroon transition"
              >
                Read Full Statement →
              </a>
            </div>

            {/* Column 2: Leadership */}
            <div className="text-center">
              <div className="mb-4">
                <Image
                  src="/images/travis.JPG"
                  alt="Travis Gluckler"
                  width={150}
                  height={150}
                  className="rounded-full mx-auto object-cover"
                  style={{ width: '150px', height: '150px' }}
                />
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
                Travis Gluckler
              </h3>
              <p className="text-maroon font-semibold mb-2">Campus Director</p>
              <p className="text-gray-700 mb-4">
                Founder of ARK Identity, Auhtor, Church Planter, Evangelist, Ministry Director at Iowa.
              </p>
              <a
                href="/team"
                className="text-navy font-semibold hover:text-maroon transition"
              >
                Meet the Team →
              </a>
            </div>

            {/* Column 3: Join Our Team */}
            <div className="text-center md:text-right">
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
                We're Hiring
              </h3>
              <p className="text-gray-700 mb-4">
                2 Campus Coordinator positions open (male + female)
              </p>
              <a
                href="/get-involved"
                className="text-navy font-semibold hover:text-maroon transition"
              >
                View Job Postings →
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
