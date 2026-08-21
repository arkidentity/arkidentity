'use client';

import Image from 'next/image';
import { useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BLOCKS = [
  { key: 'morning', label: 'Morning', hint: 'before noon' },
  { key: 'afternoon', label: 'Afternoon', hint: '12–5' },
  { key: 'evening', label: 'Evening', hint: '5–8' },
  { key: 'late', label: 'Late', hint: '8 and after' },
];

// Hand-updated. The most persuasive thing on this page is proof that other
// students exist, and this is the only kind available before anyone will go on
// record. Only put real numbers here — an invented count is a lie a student can
// catch the first time they show up. Empty is fine; nothing renders.
const REQUESTED: { slot: string; count: number }[] = [];

const JOURNAL_URL = 'https://arkiowa.dailydna.app/journal';

// A real number, on purpose. For a ministry with no public gathering, a number
// a student or a parent can actually call does more than any paragraph.
const PHONE_DISPLAY = '(319) 359-7117';
const PHONE_HREF = 'tel:+13193597117';

export default function IowaPageContent() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    availability: [] as string[],
    bringing: '',
    message: '',
    company: '', // honeypot
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formMessage, setFormMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');

    try {
      const response = await fetch('/api/iowa-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setFormStatus('success');
        setFormMessage('Got it. Somebody’ll text you in the next day or so.');
        setFormData({
          name: '', phone: '', email: '', availability: [],
          bringing: '', message: '', company: '',
        });
      } else {
        setFormStatus('error');
        setFormMessage(data.error || 'Something went wrong. Email travis@arkidentity.com and we’ll sort it out.');
      }
    } catch {
      setFormStatus('error');
      setFormMessage('Something went wrong. Email travis@arkidentity.com and we’ll sort it out.');
    }
  };

  const toggleSlot = (slot: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.includes(slot)
        ? prev.availability.filter((s) => s !== slot)
        : [...prev.availability, slot],
    }));
  };

  const scrollToSignup = () => {
    document.getElementById('pick')?.scrollIntoView({ behavior: 'smooth' });
  };

  const PrimaryButton = ({ className = '' }: { className?: string }) => (
    <button
      onClick={scrollToSignup}
      className={`px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90 ${className}`}
      style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
    >
      Pick your day and time
    </button>
  );

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent';

  return (
    <>
      {/* 1 — HEADER */}
      <section className="relative min-h-[85vh] flex items-center justify-center py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
          {/* TODO: photo of four real students at a table. Not stock. */}
          <div className="absolute inset-0 bg-black opacity-45"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            A college ministry built on tables of four.
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            One hour a week, all semester. You pick the hour.
          </p>
          <PrimaryButton />
          <p className="mt-4 text-gray-300">We’ll save you the seat.</p>
        </div>
      </section>

      {/* 3 — THE PROBLEM, AT LENGTH */}
      <section style={{ background: '#F5F2EE' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ color: 'var(--navy)' }}>
            Where does Jesus fit in your week?
          </h2>

          <div className="space-y-6 text-lg text-[#4a4540] leading-relaxed">
            <p className="text-xl">
              At home, your faith had a schedule somebody else built. Church on Sunday. Maybe a youth
              group on a Wednesday. A ride there, and people who noticed when you didn’t show up.
            </p>
            <p>
              None of that came with you. Three weeks into a semester your schedule is packed, and
              Jesus doesn’t disappear exactly — he just moves into the background. Nobody’s going to
              remind you. Nobody in your classes is going to ask how your faith is doing, at least not
              in normal conversation.
            </p>
            <p>
              <strong style={{ color: 'var(--maroon)' }}>
                Two-thirds of students who went to church every week in high school stop for at least
                a year in college.
              </strong>{' '}
              The most common reason isn’t doubt, or hypocrisy, or politics. It’s this:{' '}
              <em>I moved to college and stopped going.</em>
            </p>
            <p className="text-xl">Four years of school shouldn’t cost you your faith.</p>
            <p className="text-2xl font-bold pt-2" style={{ color: 'var(--navy)' }}>
              Nobody quits on purpose. The semester just fills up.
            </p>
            <p className="text-xl">Somehow we let the semester get so full without him.</p>
          </div>

          <p className="mt-8 text-sm text-[#8a8378]">Source: Lifeway Research.</p>
        </div>
      </section>

      {/* 4 — THE TIMES */}
      <section style={{ background: '#FAF8F5' }} className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
            Pick the hour. We’ll build the table around it.
          </h2>
          <p className="text-xl text-[#4a4540] mb-3">
            Every other option on this campus meets one night a week. If that night doesn’t work for
            you, there isn’t another one.
          </p>
          <p className="text-lg text-[#4a4540] mb-6">
            We’re not going to hand you a schedule and hope one of the times works. Tell us when
            you’re actually free, and we’ll start a table there.
          </p>
          <p className="text-lg text-[#4a4540] mb-10">
            Some hours already have students asking for them, and we’ll put you together. Some
            don’t yet, and you’d be the first one at that table. Every table starts with somebody
            being first.
          </p>

          {REQUESTED.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-6 mb-10">
              <p className="font-semibold mb-3" style={{ color: 'var(--navy)' }}>
                Hours other students have already asked for
              </p>
              <ul className="space-y-2">
                {REQUESTED.map((r) => (
                  <li key={r.slot} className="text-[#4a4540]">
                    <span className="font-semibold" style={{ color: 'var(--maroon)' }}>
                      {r.count}
                    </span>{' '}
                    {r.count === 1 ? 'student has' : 'students have'} asked for{' '}
                    <span className="font-semibold">{r.slot}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <PrimaryButton />
        </div>
      </section>

      {/* 5 — WHAT ACTUALLY HAPPENS */}
      <section style={{ background: '#F5F2EE' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ color: 'var(--navy)' }}>
            What actually happens
          </h2>
          <div className="space-y-6 text-lg text-[#4a4540] leading-relaxed">
            <p>
              Four of you, one hour. You read the passage of the day, talk about it, and say what
              you’re going to do about it. The next week you follow up on that. You pray and encourage
              one another. Somebody a year or two ahead of you runs it, and after a while, you do.
            </p>
            <p>
              Nobody is called on. Nobody is graded. Nobody is going to make you pray out loud. If you
              miss a week, somebody texts you, and that’s the whole point.
            </p>
            <p className="text-2xl font-bold pt-2" style={{ color: 'var(--navy)' }}>
              It’s one hour, and it’s an hour you defend. That’s the part that makes it work.
            </p>
          </div>
        </div>
      </section>

      {/* 6 — WHO IS RUNNING THIS */}
      <section style={{ background: '#FAF8F5' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ color: 'var(--navy)' }}>
            Who’s running this
          </h2>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <Image
              src="/images/travis.JPG"
              alt="Travis Gluckler"
              width={150}
              height={150}
              className="rounded-full object-cover flex-shrink-0"
              style={{ width: '150px', height: '150px' }}
            />
            <div className="space-y-5 text-lg text-[#4a4540] leading-relaxed">
              <p className="text-xl">
                We’ve sat across from a lot of students who meant to keep following Jesus in
                college, and watched their schedule quietly win.
              </p>
              <p>
                We’re new at Iowa. Travis isn’t new at this — he’s been teaching people to follow
                Jesus since 2013, and he has teams in Denver, Las Vegas, and Iowa. He lives in Iowa
                City.
              </p>
              <p>
                <strong style={{ color: 'var(--navy)' }}>Travis Gluckler</strong> — Campus Director
                <br />
                <a href={PHONE_HREF} className="hover:opacity-70 transition">
                  {PHONE_DISPLAY}
                </a>
                {' · '}
                <a href="mailto:travis@arkidentity.com" className="hover:opacity-70 transition">
                  travis@arkidentity.com
                </a>
                <br />
                <span className="text-[#8a8378]">Text him. He answers.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7 — THE PLAN */}
      <section style={{ background: '#F5F2EE' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-0">
            {[
              { n: '1', h: 'Pick your day and time.', b: 'Your name and a number.', t: '30 seconds' },
              { n: '2', h: 'Come sit in on one.', b: 'One table, one hour, no commitment. Nothing to bring.', t: 'This week' },
              { n: '3', h: 'Keep the same hour every week.', b: 'Same four people, all semester.', t: 'Ongoing' },
            ].map((s, i) => (
              <div
                key={s.n}
                className="flex gap-5 py-6"
                style={{ borderTop: i > 0 ? '1px solid #e8e4df' : 'none' }}
              >
                <div
                  className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: 'var(--navy)' }}
                >
                  {s.n}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
                    {s.h}
                  </h3>
                  <p className="text-[#4a4540]">
                    {s.b} <span className="italic text-[#8a8378]">{s.t}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — IF NOTHING CHANGES */}
      <section style={{ background: 'var(--navy)' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Four years from now, if nothing changes.
          </h2>
          <div className="space-y-4 text-lg md:text-xl text-gray-200 leading-relaxed">
            <p>
              Freshman year you tried to make Jesus a priority. By junior year he’d been in the
              background so long you stopped noticing.
            </p>
            <p>
              Your Bible is the one your church gave you at graduation, and you know exactly where it
              is.
            </p>
            <p>You go home in the summer and go with your parents, and it feels like visiting.</p>
            <p>
              You graduate with a degree, and the faith you showed up with is the one thing college
              took.
            </p>
            <p className="italic pt-2" style={{ color: 'var(--gold)' }}>
              It doesn’t have to go that way.
            </p>
          </div>
        </div>
      </section>

      {/* 9 — FOUR YEARS FROM NOW */}
      <section style={{ background: '#FAF8F5' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: 'var(--navy)' }}>
            Four years from now.
          </h2>
          <div className="space-y-4 text-lg md:text-xl text-[#4a4540] leading-relaxed">
            <p>There’s an hour on your calendar you’ve defended since freshman year.</p>
            <p>You open your Bible without needing a reason to.</p>
            <p>Three people know your worst semester because they were in it.</p>
            <p>There’s a table meeting every week at Iowa that exists because you started it.</p>
            <p className="text-2xl font-bold pt-2" style={{ color: 'var(--navy)' }}>
              And when you graduate, it keeps going without you.
            </p>
          </div>
          <div className="mt-10">
            <PrimaryButton />
          </div>
        </div>
      </section>

      {/* 10 — PICK YOUR DAY AND TIME (the form) */}
      <section id="pick" style={{ background: '#F5F2EE' }} className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
              Pick your day and time
            </h2>
            <p className="text-lg text-[#5a5247]">
              Your name and a number. Somebody texts you, and that’s it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                Your name
              </label>
              <input
                type="text" id="name" required placeholder="First and last"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                A number we can text
              </label>
              <input
                type="tel" id="phone" required placeholder="(555) 555-5555"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <span className="block text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>
                When are you actually free?
              </span>
              <p className="text-sm text-[#8a8378] mb-3">
                Tap everything that works. The more you tap, the easier you are to place.
              </p>
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full border-separate" style={{ borderSpacing: '4px' }}>
                  <thead>
                    <tr>
                      <th className="w-20"></th>
                      {BLOCKS.map((b) => (
                        <th key={b.key} className="pb-1 text-center">
                          <span className="block text-xs font-bold" style={{ color: 'var(--navy)' }}>
                            {b.label}
                          </span>
                          <span className="block text-[10px] text-[#8a8378]">{b.hint}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day}>
                        <th className="text-left text-xs font-bold pr-1" style={{ color: 'var(--navy)' }}>
                          {day.slice(0, 3)}
                        </th>
                        {BLOCKS.map((b) => {
                          const slot = `${day} ${b.label.toLowerCase()}`;
                          const on = formData.availability.includes(slot);
                          return (
                            <td key={b.key}>
                              <button
                                type="button"
                                onClick={() => toggleSlot(slot)}
                                aria-pressed={on}
                                aria-label={`${day} ${b.label}`}
                                className="w-full h-10 rounded-md text-xs font-semibold transition"
                                style={{
                                  backgroundColor: on ? 'var(--gold)' : '#f1ede7',
                                  color: on ? 'var(--navy)' : '#8a8378',
                                  border: on ? '1px solid var(--gold)' : '1px solid #e2ddd5',
                                }}
                              >
                                {on ? '\u2713' : ''}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {formData.availability.length === 0 && (
                <p className="text-sm text-[#8a8378] mt-2">Pick at least one.</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                Email <span className="font-normal text-[#8a8378]">(optional)</span>
              </label>
              <input
                type="email" id="email" placeholder="you@uiowa.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="bringing" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                Bringing anybody? <span className="font-normal text-[#8a8378]">(optional)</span>
              </label>
              <input
                type="text" id="bringing" placeholder="Their name"
                value={formData.bringing}
                onChange={(e) => setFormData({ ...formData, bringing: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
                Anything you want to ask <span className="font-normal text-[#8a8378]">(optional)</span>
              </label>
              <textarea
                id="message" rows={3} placeholder="Or when you’re actually free, if none of the times work"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* honeypot — hidden from humans */}
            <input
              type="text" name="company" tabIndex={-1} autoComplete="off"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              style={{ position: 'absolute', left: '-9999px' }}
              aria-hidden="true"
            />

            <button
              type="submit"
              disabled={formStatus === 'loading'}
              className="w-full px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
            >
              {formStatus === 'loading' ? 'Sending...' : 'Save me the seat'}
            </button>

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

      {/* 11 — NOT READY FOR A TABLE (secondary CTA) */}
      <section style={{ background: '#FAF8F5' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
            Not ready to sit down with three other people?
          </h2>
          <p className="text-lg text-[#4a4540] mb-8">
            Start on your own. Ten minutes a day — the same thing a table does, minus the other
            three.
          </p>

          <p className="text-2xl md:text-3xl font-bold mb-8" style={{ color: 'var(--navy)' }}>
            <span style={{ color: 'var(--gold)' }}>Bible.</span> Listen.{' '}
            <span style={{ color: 'var(--gold)' }}>Obey.</span> Repeat.
          </p>

          <div className="space-y-3 mb-8">
            {[
              ['HEAD', 'What is this passage saying?'],
              ['HEART', 'God, what are you saying to me?'],
              ['HANDS', 'What do you want me to do?'],
            ].map(([label, q]) => (
              <div key={label} className="flex flex-wrap gap-x-3 items-baseline">
                <span className="font-bold text-sm tracking-wider w-20" style={{ color: 'var(--navy)' }}>
                  {label}
                </span>
                <span className="text-lg text-[#4a4540]">{q}</span>
              </div>
            ))}
          </div>

          <p className="text-lg text-[#4a4540] mb-8">
            That’s it. Ten minutes, every day, and it’s free.
          </p>

          <a
            href={JOURNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-7 py-3 rounded-lg font-semibold transition hover:opacity-80"
            style={{ border: '2px solid var(--navy)', color: 'var(--navy)' }}
          >
            Get the journal
          </a>

          <p className="text-xl font-bold mt-10" style={{ color: 'var(--navy)' }}>
            Who else would do this with you at a table?
          </p>
        </div>
      </section>

      {/* 12 — QUESTIONS */}
      <section style={{ background: '#F5F2EE' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-10" style={{ color: 'var(--navy)' }}>
            The questions people are too polite to ask
          </h2>

          <dl className="space-y-7">
            {[
              ['Is this a cult?', 'Fair question. Everything we teach comes straight out of the Bible, and we’ll tell you exactly what we believe before you ever sit down. Nobody asks you for money. You can stop coming any week and nobody will chase you. We meet in fours because it’s the only size where everybody actually talks, not because we’re hiding.'],
              ['I don’t have time.', 'One hour a week, at a time you pick. If none of the times work, tell us and we’ll start one that does.'],
              ['Is it guys and girls together?', 'Separate — guys with guys, girls with girls. A table of four gets honest fast, and that’s easier when it isn’t mixed.'],
              ['I don’t really know what I believe.', 'Then you’re the easiest person to have at a table. Bring the questions. Nobody’s going to ask you to perform.'],
              ['I already go to Cru, or Salt, or a church.', 'Good, keep going. This isn’t instead of that. This is the four people who read the Bible with you during the week.'],
              ['Do I have to talk?', 'Not the first time. Or the second.'],
              ['Do I have to know the Bible?', 'No. If you needed to already know it, we wouldn’t be much use.'],
              ['Does it cost anything?', 'No. And we’re never going to ask you for money.'],
              ['What if I don’t click with the other three?', 'Tell us and we’ll move you. No explanation, no hard feelings. Four people is small enough that fit matters, so we’d rather move you than lose you.'],
              ['What if I miss a week?', 'Somebody texts you. That’s the whole point.'],
              ['What happens after a year?', 'You’ll know how to lead a table well enough to start your own. Most people do, around a year in. That’s not a job we talk you into. It’s what the year was for.'],
            ].map(([q, a]) => (
              <div key={q}>
                <dt className="text-lg font-bold mb-2" style={{ color: 'var(--navy)' }}>
                  {q}
                </dt>
                <dd className="text-[#4a4540] leading-relaxed">{a}</dd>
              </div>
            ))}
            <div>
              <dt className="text-lg font-bold mb-2" style={{ color: 'var(--navy)' }}>
                What do you believe?
              </dt>
              <dd className="text-[#4a4540] leading-relaxed">
                Nothing unusual. The same things the church has believed for two thousand years, and
                it’s all written out — worth two minutes before you come.{' '}
                <a href="/beliefs" className="font-semibold underline" style={{ color: 'var(--navy)' }}>
                  Read it here
                </a>
                .
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 13 — FINAL CALL */}
      <section style={{ background: '#FAF8F5' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: 'var(--navy)' }}>
            One hour a week, three other people, and by the end of the year you’ll know how to lead
            a table of your own.
          </h2>
          <PrimaryButton />
          <p className="mt-4 text-[#8a8378]">We’ll save you the seat.</p>
        </div>
      </section>

      {/* 14 — FOOTER */}
      <section style={{ background: '#F5F2EE', borderTop: '1px solid #e8e4df' }} className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
            ARK Iowa — a campus ministry at the University of Iowa.
          </p>
          <ul className="space-y-3 text-[#4a4540]">
            <li>
              <a href="/beliefs" className="font-semibold hover:opacity-70 transition" style={{ color: 'var(--navy)' }}>
                What we believe
              </a>
            </li>
            <li>
              <a href="/team" className="font-semibold hover:opacity-70 transition" style={{ color: 'var(--navy)' }}>
                Who we are
              </a>
            </li>
            <li>
              <a href="/get-involved" className="font-semibold hover:opacity-70 transition" style={{ color: 'var(--navy)' }}>
                We’re hiring
              </a>
            </li>
            <li>
              <a href={PHONE_HREF} className="font-semibold hover:opacity-70 transition" style={{ color: 'var(--navy)' }}>
                {PHONE_DISPLAY}
              </a>{' · '}
              <a href="mailto:travis@arkidentity.com" className="font-semibold hover:opacity-70 transition" style={{ color: 'var(--navy)' }}>
                travis@arkidentity.com
              </a>{' '}
              · Iowa City, IA
            </li>
          </ul>

          <p className="mt-6 text-[#4a4540]">
            Parents: that number goes straight to Travis. Call it.
          </p>
        </div>
      </section>
    </>
  );
}
