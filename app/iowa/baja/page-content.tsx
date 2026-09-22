'use client';

import { useState } from 'react';
import Image from 'next/image';

// Messaging: StoryBrand/PEACE set locked with Travis 2026-09-22. Source of truth +
// reasoning: ark-workspace/projects/ark-identity/messaging/iowa/baja-2027.md.
//   Problem: You intend to serve God and people somewhere, someday.
//   Empathy: Somehow someday never gets a date.
//   Answer:  We'll take you to Baja for a week and hand you a hammer.
//   Change:  You find out what Jesus can do through your two hands.
//   End:     A family in Mexico moves into a home you built, and you come home as someone who takes action.
// Villain = "someday" (the drift), never the student's reluctance.
// Hero is the student. The fundraising schedule lives in the admin checklist and
// the interest meeting, not on this page.

// Photos from uReach's Baja base and build sites.
function Photo({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-gray-200 ${className}`}>
      <Image src={src} alt={alt} fill sizes="(min-width: 768px) 384px, 100vw" className="object-cover" />
    </div>
  );
}

// Set this once the video exists; the section shows a placeholder until then.
const VIDEO_EMBED_URL = '';

const PHONE_DISPLAY = '(319) 359-7117';
const PHONE_HREF = 'tel:+13193597117';

const CTA = 'Hold my spot at the interest meeting';

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

function CtaButton({ className = '' }: { className?: string }) {
  return (
    <button
      onClick={() => document.getElementById('interested')?.scrollIntoView({ behavior: 'smooth' })}
      className={`px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90 ${className}`}
      style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
    >
      {CTA}
    </button>
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
          <label className="block text-sm font-semibold mb-1" style={navy} htmlFor="baja-email">Email</label>
          <input id="baja-email" name="email" type="email" required className={input} autoComplete="email" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1" style={navy} htmlFor="baja-year">Year (optional)</label>
        <select id="baja-year" name="year" className={input} defaultValue="">
          <option value="">—</option>
          <option value="first-year">First-year</option>
          <option value="sophomore">Sophomore</option>
          <option value="junior">Junior</option>
          <option value="senior">Senior</option>
          <option value="grad">Grad</option>
          <option value="other">Other</option>
        </select>
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
        {state === 'sending' ? 'Sending…' : CTA}
      </button>
      <p className="text-sm text-[#8a8378]">
        Holding a spot isn’t a commitment. It just gets you the interest meeting details.
      </p>
    </form>
  );
}

export default function BajaPageContent() {
  return (
    <>
      {/* HERO — the End Result, with the student in it */}
      <section className="relative min-h-[80vh] flex items-center justify-center py-24">
        <div className="absolute inset-0 bg-gray-900">
          <Image src="/iowa/baja/roof.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[center_30%]" />
          <div className="absolute inset-0 bg-black opacity-55"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <p className="uppercase tracking-widest text-sm mb-4" style={{ color: 'var(--gold)' }}>
            ARK Iowa · Baja, Mexico · Summer 2027
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            This summer, a family in Mexico moves into a home you built.
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">One week in Baja with ARK Iowa.</p>
          <CtaButton />
          <p className="mt-4 text-gray-300">Not a commitment. Just a seat at the meeting.</p>
        </div>
      </section>

      {/* SOMEDAY — Problem + Empathy + Answer */}
      <Section bg="#F5F2EE">
        <H2>Someday</H2>
        <div className={`space-y-5 ${body}`}>
          <p className="text-xl">You intend to serve God and people somewhere, someday.</p>
          <p>
            Maybe after graduation. Maybe once you have more money, or more time, or better Spanish. Maybe
            when going somewhere hard feels a little less scary than it does right now.
          </p>
          <p className="text-2xl font-bold pt-2" style={navy}>
            Somehow someday never gets a date.
          </p>
          <p>
            Every summer fills up with a job, an internship, a trip home. Serving stays a plan you really do
            mean to get to.
          </p>
          <p className="text-xl">
            So let’s put it on the calendar. We’ll take you to Baja for a week and hand you a hammer.
          </p>
        </div>
      </Section>

      {/* FRIDAY — Change, shown as a scene.
          TODO(uReach call): confirm teams finish and hand over the house by Friday. */}
      <Section bg="#FAF8F5">
        <H2>Friday afternoon</H2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Photo src="/iowa/baja/framing.jpg" alt="A team framing the walls of a home" className="aspect-[4/5]" />
          <Photo src="/iowa/baja/saw.jpg" alt="A student cutting lumber on a build site" className="aspect-[4/5]" />
        </div>
        <div className={`space-y-5 ${body}`}>
          <p>
            On Monday it was a slab of concrete in a dirt lot. By Friday there are walls you framed, a roof you
            nailed down, and paint still drying on the door. A mom walks through that door with her kids
            behind her, and they start arguing over which room is theirs.
          </p>
          <p>
            Your whole team circles up in the yard and prays over the house. Your hands are blistered. Your
            shirt is ruined. You have never been this tired or this sure that God was in something.
          </p>
          <p className="text-2xl font-bold pt-2" style={navy}>
            You find out what Jesus can do through your two hands.
          </p>
        </div>
      </Section>

      {/* THE PLAN */}
      <Section bg="#F5F2EE">
        <H2>How you get there</H2>
        <ol className="space-y-6">
          {[
            ['Hold your spot', 'Fill out the form below. It takes a minute and it isn’t a commitment.', 'Now'],
            ['Come to the interest meeting', 'Dates, cost, passports, fundraising, and every question you have.', 'October'],
            ['Go', 'One week in Baja with your team.', 'Summer 2027'],
          ].map(([title, text, when], i) => (
            <li key={title} className="flex gap-5">
              <span
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'var(--gold)', color: 'var(--navy)' }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-xl font-semibold" style={navy}>
                  {title} <span className="text-sm font-semibold ml-1" style={{ color: 'var(--maroon)' }}>{when}</span>
                </p>
                <p className="text-[#4a4540] text-lg">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <CtaButton className="w-full sm:w-auto" />
        </div>
      </Section>

      {/* THE WEEK — enlightenment starts here */}
      <Section bg="#FAF8F5">
        <H2>What the week looks like</H2>
        <p className={`${body} mb-6`}>
          We’re going with uReach, a ministry that hosts teams at a base in the San Quintín Valley and connects
          them with local churches and families. They’ve built more than 170 homes and schools there since
          2008. The exact projects get set closer to the trip, and they usually include:
        </p>
        <ul className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            'Building a home for a family in need',
            'Youth camps and outreach with local kids',
            'Serving alongside local churches',
            'An activity day, often at the beach',
          ].map((item) => (
            <li key={item} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 text-[#4a4540]">
              {item}
            </li>
          ))}
        </ul>
        <div className="grid sm:grid-cols-2 gap-4">
          <Photo src="/iowa/baja/base-night.jpg" alt="The uReach base courtyard at dusk" className="aspect-video" />
          <Photo src="/iowa/baja/base-day.jpg" alt="The uReach base and dining hall" className="aspect-video" />
        </div>
        <p className="mt-3 text-sm text-[#8a8378]">Home for the week: the uReach base.</p>
        <p className={`${body} mt-8`}>
          Every day we pray, worship, and talk through what God is doing. You come home more like Jesus and
          more ready to make disciples.
        </p>
        <div className="aspect-video rounded-xl overflow-hidden bg-gray-900 mt-10 flex items-center justify-center">
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
            Before you decide anything about money or schedules, ask the Father if he is sending you. Choose the
            one that lands hardest for you:
          </p>
          <ol className="space-y-4 list-decimal pl-6 text-lg text-gray-100">
            <li>Where do you sense God nudging you toward people who have never heard the gospel?</li>
            <li>What excuse or fear shows up first when you think about going? What would it look like to hand that to Jesus?</li>
            <li>Who could you ask to pray with you about this decision?</li>
          </ol>
        </div>
      </section>

      {/* THE DETAILS */}
      <Section bg="#F5F2EE">
        <H2>The details</H2>
        <dl className="space-y-5">
          {[
            ['When', 'June or July 2027. The exact week gets confirmed with uReach. Plan on 8 or 9 days with travel.'],
            ['Where', 'The uReach base in the San Quintín Valley, Baja California, about 4 hours south of the border.'],
            ['Travel', 'We fly to San Diego together, and uReach vans take us from the airport to the base and back.'],
            ['Passport', 'You need a valid one. If you don’t have one, start the application this fall.'],
            ['Cost', 'About $1,400 to $1,650 total. That’s $927 to uReach for meals, lodging, the vans, project materials, and insurance, plus your flight and a little spending money. A passport is about $165 more if you need one.'],
          ].map(([k, v]) => (
            <div key={k} className="sm:flex gap-6">
              <dt className="font-semibold sm:w-28 shrink-0" style={{ color: 'var(--maroon)' }}>{k}</dt>
              <dd className="text-[#4a4540] text-lg">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-xl font-semibold" style={navy}>
          Money should never be the only reason you stay home.
        </p>
        <p className={body}>We’ll walk through fundraising step by step at the interest meeting.</p>
      </Section>

      {/* FINAL BAND + FORM */}
      <Section bg="#FAF8F5" id="interested">
        <H2>Give someday a date.</H2>
        <p className={`${body} mb-8`}>
          A family in Mexico moves into a home you built, and you come home as someone who takes action. It
          starts with a seat at the interest meeting.
        </p>
        <InterestForm />
        <p className="mt-6 text-[#4a4540]">
          Rather talk? Call or text{' '}
          <a href={PHONE_HREF} className="font-semibold underline" style={navy}>{PHONE_DISPLAY}</a>.
        </p>
      </Section>
    </>
  );
}
