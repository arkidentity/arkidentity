'use client';

import { useState } from 'react';

// Source copy: "Baja Mission Trip 2027" doc (Travis, 2026-09-21). Keep in sync.
// Set this once the video exists; the section shows a placeholder until then.
const VIDEO_EMBED_URL = '';

const PHONE_DISPLAY = '(319) 359-7117';
const PHONE_HREF = 'tel:+13193597117';

const COSTS: [string, string][] = [
  ['uReach trip cost', '$900'],
  ['Round-trip flight to San Diego', '$400 to $600, updated once flights are booked'],
  ['Spending money for the beach day and shopping day', '$50 to $100'],
  ['Passport, if you need one', 'About $165'],
];

const SCHEDULE: [string, string, string][] = [
  ['Sept 2026', 'Overview and video go out. Everyone prays.', '$0'],
  ['Oct 2026', 'Interest meeting. Passport applications begin.', '$0'],
  ['Nov 2026', 'Commit and pay the deposit to hold your spot. Write your support letter.', '$100'],
  ['Dec 2026', 'Send support letters before Christmas. Ask family and your home church.', '$300'],
  ['Jan 2027', 'Thank every giver. Share one prayer update.', '$500'],
  ['Feb 2027', 'Flights booked. Team fundraiser.', '$750'],
  ['Mar 2027', 'Second round of asks. Spring break follow-ups.', '$1,000'],
  ['Apr 2027', 'uReach second payment due.', '$1,250'],
  ['May 2027', 'Final payment due. Goal fully raised.', '$1,500'],
  ['June or July 2027', 'Commissioning night, then we go.', 'Done'],
];

const navy = { color: 'var(--navy)' };
const body = 'text-lg text-[#4a4540] leading-relaxed';

function Section({ bg, children, id }: { bg: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} style={{ background: bg }} className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl md:text-4xl font-bold mb-6" style={navy}>
      {children}
    </h2>
  );
}

function InterestForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setState('sending');
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const res = await fetch('/api/iowa-baja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Try again.');
      setState('done');
    } catch (err) {
      setError((err as Error).message);
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-xl font-semibold mb-2" style={navy}>Got it. Thank you.</p>
        <p className={body}>
          We’ll text you with the interest meeting date. Until then, keep praying about it.
        </p>
      </div>
    );
  }

  const input =
    'w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--gold)]';

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div>
        <label className="block text-sm font-semibold mb-1" style={navy} htmlFor="baja-name">Name</label>
        <input id="baja-name" name="name" required className={input} autoComplete="name" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" style={navy} htmlFor="baja-phone">Phone (we’ll text you)</label>
          <input id="baja-phone" name="phone" type="tel" required className={input} autoComplete="tel" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" style={navy} htmlFor="baja-email">Email (optional)</label>
          <input id="baja-email" name="email" type="email" className={input} autoComplete="email" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1" style={navy} htmlFor="baja-passport">Do you have a valid passport?</label>
        <select id="baja-passport" name="hasPassport" className={input} defaultValue="Not sure">
          <option>Yes</option>
          <option>No</option>
          <option>Not sure</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1" style={navy} htmlFor="baja-message">Questions? (optional)</label>
        <textarea id="baja-message" name="message" rows={3} className={input} />
      </div>
      {error && <p className="text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full sm:w-auto px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
      >
        {state === 'sending' ? 'Sending…' : 'I’m interested'}
      </button>
      <p className="text-sm text-[#8a8378]">
        Saying you’re interested isn’t a commitment. It just gets you the interest meeting details.
      </p>
    </form>
  );
}

export default function BajaPageContent() {
  const scrollToForm = () => document.getElementById('interested')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[75vh] flex items-center justify-center py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
          {/* TODO: photo from a uReach week in San Quintín. */}
          <div className="absolute inset-0 bg-black opacity-45"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <p className="uppercase tracking-widest text-sm mb-4" style={{ color: 'var(--gold)' }}>
            ARK Iowa · Summer 2027
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">Baja Mission Trip</h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            A week of serving and sharing Jesus in Baja California, Mexico.
          </p>
          <button
            onClick={scrollToForm}
            className="px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
          >
            I’m interested
          </button>
        </div>
      </section>

      {/* WHY BAJA */}
      <Section bg="#F5F2EE">
        <H2>Why Baja</H2>
        <div className={`space-y-5 ${body}`}>
          <p>
            This summer we are taking a team of college students to Baja California, Mexico, for a week of
            serving and sharing Jesus. We are partnering with uReach, a ministry that hosts teams at a base in
            the San Quintín Valley and connects them with local churches and families.
          </p>
          <p>
            This is an invitation to pray about. Some of you will feel a clear yes. Some of you will need months
            to sort out money, school, and summer plans. That is why we are putting everything in your hands
            now, almost a year ahead.
          </p>
        </div>
      </Section>

      {/* WHAT WE'LL DO */}
      <Section bg="#FAF8F5">
        <H2>What we’ll do</H2>
        <p className={`${body} mb-6`}>
          A week with uReach mixes hands-on work with time spent with people. The exact projects get set closer
          to the trip, and they usually include:
        </p>
        <ul className="grid sm:grid-cols-2 gap-4 mb-6">
          {[
            'Building a home for a family in need',
            'Youth camps and sports outreach with local kids',
            'Serving alongside local churches and ministries',
            'A beach day and a shopping day',
          ].map((item) => (
            <li key={item} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 text-[#4a4540]">
              {item}
            </li>
          ))}
        </ul>
        <p className={body}>
          We will also pray, worship, and debrief together every day. The goal is for you to come home more like
          Jesus and more ready to make disciples.
        </p>
      </Section>

      {/* WHEN AND WHERE */}
      <Section bg="#F5F2EE">
        <H2>When and where</H2>
        <dl className="space-y-5">
          {[
            ['Dates', 'June or July 2027, exact week to be confirmed with uReach. The trip is 7 days on the ground, plus travel days, so plan for 8 or 9 days total.'],
            ['Where', 'uReach’s base in the San Quintín Valley, Baja California, about a 4 to 5 hour drive south of San Diego.'],
            ['Travel', 'We fly to San Diego together, and uReach vans take us to the base and back.'],
            ['Passport', 'You need a valid passport. If you do not have one, start the application this fall.'],
          ].map(([k, v]) => (
            <div key={k} className="sm:flex gap-6">
              <dt className="font-semibold sm:w-32 shrink-0" style={{ color: 'var(--maroon)' }}>{k}</dt>
              <dd className="text-[#4a4540] text-lg">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* COST */}
      <Section bg="#FAF8F5">
        <H2>What it costs</H2>
        <p className={`${body} mb-6`}>
          The trip cost covers van travel from San Diego, all meals, and lodging at the base. Your own costs are
          the flight to San Diego, a little spending money, and a passport if you need one.
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <table className="w-full text-left">
            <tbody>
              {COSTS.map(([item, est]) => (
                <tr key={item} className="border-b border-gray-100">
                  <td className="px-5 py-4 text-[#4a4540]">{item}</td>
                  <td className="px-5 py-4 text-[#4a4540] text-right">{est}</td>
                </tr>
              ))}
              <tr style={{ background: '#faf6ee' }}>
                <td className="px-5 py-4 font-bold" style={navy}>Total</td>
                <td className="px-5 py-4 font-bold text-right" style={navy}>
                  About $1,350 to $1,600, plus a passport if needed
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xl font-semibold" style={navy}>
          Money should never be the only reason you stay home.
        </p>
        <p className={body}>Read the fundraising schedule below and talk to me.</p>
      </Section>

      {/* VIDEO */}
      <Section bg="#F5F2EE">
        <H2>Watch the video</H2>
        <div className="aspect-video rounded-xl overflow-hidden bg-gray-900 mb-6 flex items-center justify-center">
          {VIDEO_EMBED_URL ? (
            <iframe
              src={VIDEO_EMBED_URL}
              title="Baja Mission Trip 2027"
              className="w-full h-full"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <p className="text-gray-300">Video coming soon.</p>
          )}
        </div>
        <p className={body}>
          Watch it once to see what a week in Baja looks like. Then take it to prayer.
        </p>
      </Section>

      {/* PRAY */}
      <section className="py-16 md:py-20" style={{ background: 'var(--navy)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pray into it</h2>
          <blockquote className="text-2xl italic mb-2" style={{ color: 'var(--gold)' }}>
            “Then I said, ‘Here am I. Send me!’”
          </blockquote>
          <p className="text-gray-300 mb-8">Isaiah 6:8 NASB</p>
          <p className="text-lg text-gray-200 mb-6">
            Before you decide anything about money or schedules, ask the Father if He is sending you. Choose the
            one that lands hardest for you:
          </p>
          <ol className="space-y-4 list-decimal pl-6 text-lg text-gray-100">
            <li>Where do you sense God nudging you toward people who have never heard the gospel?</li>
            <li>What excuse or fear shows up first when you think about going? What would it look like to hand that to Jesus?</li>
            <li>Who could you ask to pray with you about this decision?</li>
          </ol>
        </div>
      </section>

      {/* FUNDRAISING */}
      <Section bg="#FAF8F5">
        <H2>Fundraising schedule</H2>
        <p className={`${body} mb-8`}>
          The goal for each student is about $1,500, which covers the trip cost, the flight, and spending money.
          The dates below are targets. We will match them to uReach’s actual payment deadlines once they are
          confirmed. Details on how gifts are given will be shared at the interest meeting.
        </p>
        <ol className="relative border-l-2 ml-2" style={{ borderColor: 'var(--gold)' }}>
          {SCHEDULE.map(([when, what, total]) => (
            <li key={when} className="ml-6 pb-6 last:pb-0">
              <span
                className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full"
                style={{ background: 'var(--gold)' }}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className="font-semibold" style={navy}>{when}</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--maroon)' }}>
                  {total === 'Done' ? 'Done' : `${total} raised`}
                </p>
              </div>
              <p className="text-[#4a4540]">{what}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* NEXT STEPS + FORM */}
      <Section bg="#F5F2EE" id="interested">
        <H2>Next steps</H2>
        <ol className={`space-y-3 list-decimal pl-6 mb-10 ${body}`}>
          <li>Watch the video and pray about it.</li>
          <li>Tell me you are interested by the interest meeting.</li>
          <li>Come to the interest meeting in October (date to be announced).</li>
          <li>If you do not have a passport, start your application now.</li>
        </ol>
        <InterestForm />
        <p className="mt-6 text-[#4a4540]">
          Rather talk? Call or text{' '}
          <a href={PHONE_HREF} className="font-semibold underline" style={navy}>{PHONE_DISPLAY}</a>.
        </p>
      </Section>
    </>
  );
}
