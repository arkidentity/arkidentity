'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Big_Shoulders_Stencil, Public_Sans } from 'next/font/google';

// Messaging: StoryBrand/PEACE set locked with Travis 2026-09-22. Source of truth +
// reasoning: ark-workspace/projects/ark-identity/messaging/iowa/baja-2027.md.
//   Problem: You intend to serve God and people somewhere, someday.
//   Empathy: Somehow someday never gets a date.
//   Answer:  We'll take you to Baja for a week and hand you a hammer.
//   Change:  You find out what Jesus can do through your two hands.
//   End:     A family in Mexico moves into a home you built, and you come home as someone who takes action.
// Villain = "someday" (the drift), never the student's reluctance.
//
// Design (human-made-sites skill, 11/8; plan: docs/planning/baja-page-redesign-PLAN.md):
//   Concept: the build week, Monday slab to Friday keys. The one bold thing: "June 13–19" in a stencil
//   face, like a lot number spray-painted on a build site. Everything else quiet: Public Sans, white
//   paper, ARK navy ink, lumber tan blocks, barn red (from the roof photo) for the main action only.
//   No eyebrows, no middle dots, no dark wash on the hero photo, no identical cards.

const stencil = Big_Shoulders_Stencil({ subsets: ['latin'], weight: ['800'], display: 'swap' });
const sans = Public_Sans({ subsets: ['latin'], display: 'swap' });

const BARN = '#a5372b';
const LUMBER = '#ead9bd';
const INK = 'var(--navy)';

// Set this once the video exists; the section is hidden until then.
const VIDEO_EMBED_URL = '';

const PHONE_DISPLAY = '(319) 359-7117';
const PHONE_HREF = 'tel:+13193597117';

const navy = { color: INK };
const body = 'text-lg text-[#3d3a36] leading-relaxed';

function goRegister() {
  document.getElementById('hold')?.scrollIntoView({ behavior: 'smooth' });
}

function HoldButton({ className = '' }: { className?: string }) {
  return (
    <button onClick={goRegister} className={`px-7 py-4 rounded-md font-semibold text-lg text-white transition hover:brightness-110 ${className}`} style={{ backgroundColor: BARN }}>
      Hold my spot
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
      <div className="bg-white rounded-md border border-[#d8d2c6] p-6">
        <p className="text-xl font-semibold mb-2" style={navy}>Got it. Thank you.</p>
        <p className={body}>
          We’ll text you soon to answer your questions. Until then, keep praying about it.
        </p>
      </div>
    );
  }

  const input =
    'w-full rounded-md border border-[#bdb6a8] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--navy)]';

  return (
    <form onSubmit={submit} className="bg-white rounded-md border border-[#d8d2c6] p-6 space-y-4">
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
          <option value="">Pick one</option>
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
        className="w-full sm:w-auto px-8 py-4 rounded-md font-semibold text-lg transition hover:opacity-90 disabled:opacity-60 border-2 border-[var(--navy)]"
        style={{ color: 'var(--navy)' }}
      >
        {state === 'sending' ? 'Sending…' : 'Tell me more'}
      </button>
      <p className="text-sm text-[#8a8378]">
        Not a commitment. We’ll text you answers and the next meeting date.
      </p>
    </form>
  );
}


/** "I'm in" (Mig 047, Travis 10/24): for students already committed. Reserves a spot; the $200 deposit comes next. */
function RegisterToGo() {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const input = 'w-full rounded-md border border-[#bdb6a8] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--navy)]';
  const label = 'block text-sm font-semibold mb-1';

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(''); setState('sending');
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const res = await fetch('/api/iowa-baja/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Try again.');
      setState('done');
    } catch (err) { setError((err as Error).message); setState('idle'); }
  }

  if (state === 'done') {
    return (
      <div className="bg-white rounded-md border-2 border-[var(--navy)] p-6">
        <p className="text-xl font-semibold mb-2" style={navy}>You’re in. Let’s go.</p>
        <p className={body}>Your spot is saved. Next is the $200 deposit, which is your first fundraising goal. We’ll text you how to give it and how to start raising support.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="bg-white rounded-md border-2 border-[var(--navy)] p-6 space-y-4">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <p className="text-2xl font-bold" style={navy}>Hold my spot</p>
      <p className={`${body} text-sm`}>June 13–19, 2027. A $200 deposit holds your spot, and it’s your first fundraising goal. We’ll text you how to pay it.</p>
      <div><label className={label} style={navy} htmlFor="r-name">Name</label><input id="r-name" name="name" required className={input} autoComplete="name" /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={label} style={navy} htmlFor="r-phone">Phone</label><input id="r-phone" name="phone" type="tel" required className={input} autoComplete="tel" /></div>
        <div><label className={label} style={navy} htmlFor="r-email">Email</label><input id="r-email" name="email" type="email" required className={input} autoComplete="email" /></div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div><label className={label} style={navy} htmlFor="r-school">School</label><input id="r-school" name="school" className={input} /></div>
        <div><label className={label} style={navy} htmlFor="r-year">Year</label>
          <select id="r-year" name="year" className={input} defaultValue=""><option value="">Pick one</option><option value="first-year">First-year</option><option value="sophomore">Sophomore</option><option value="junior">Junior</option><option value="senior">Senior</option><option value="grad">Grad</option><option value="other">Other</option></select>
        </div>
        <div><label className={label} style={navy} htmlFor="r-bday">Birthday</label><input id="r-bday" name="birthday" type="date" className={input} /></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={label} style={navy} htmlFor="r-pass">Passport</label>
          <select id="r-pass" name="passport" className={input} defaultValue="need"><option value="have">I have one</option><option value="applied">I applied</option><option value="need">I need one</option></select>
        </div>
        <div><label className={label} style={navy} htmlFor="r-exp">Passport expires (if you have one)</label><input id="r-exp" name="passport_expires" type="date" className={input} /></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={label} style={navy} htmlFor="r-ename">Emergency contact</label><input id="r-ename" name="emergency_name" required className={input} /></div>
        <div><label className={label} style={navy} htmlFor="r-ephone">Their phone</label><input id="r-ephone" name="emergency_phone" type="tel" required className={input} /></div>
      </div>
      <div><label className={label} style={navy} htmlFor="r-med">Allergies, medical needs or diet (optional)</label><textarea id="r-med" name="medical" rows={2} className={input} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={label} style={navy} htmlFor="r-shirt">Shirt size</label>
          <select id="r-shirt" name="shirt" className={input} defaultValue=""><option value="">Pick one</option>{['XS', 'S', 'M', 'L', 'XL', '2XL'].map(x => <option key={x}>{x}</option>)}</select>
        </div>
        <div><label className={label} style={navy} htmlFor="r-note">Questions (optional)</label><input id="r-note" name="note" className={input} /></div>
      </div>
      <label className="flex items-start gap-3 text-[#4a4540]">
        <input type="checkbox" name="commit" required className="mt-1 h-5 w-5" />
        <span>I’m committing to go to Baja and to raise my support, starting with the $200 deposit.</span>
      </label>
      {error && <p className="text-red-700">{error}</p>}
      <button type="submit" disabled={state === 'sending'} className="w-full sm:w-auto px-8 py-4 rounded-md font-semibold text-lg transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: BARN, color: '#fff' }}>{state === 'sending' ? 'Sending…' : 'Hold my spot'}</button>
    </form>
  );
}

function StickyHold() {
  // Phones only: shows once the hero button has scrolled away, hides at the form.
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => {
      const form = document.getElementById('hold');
      const atForm = form ? form.getBoundingClientRect().top < window.innerHeight * 0.6 : false;
      setShow(window.scrollY > window.innerHeight * 0.8 && !atForm);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!show) return null;
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-20 p-3 bg-white/95 border-t border-[#e4dfd6]">
      <HoldButton className="w-full" />
    </div>
  );
}

export default function BajaPageContent() {
  const week: [string, string, string | null][] = [
    ['Mon', 'A slab of concrete in a dirt lot. You meet the family you’re building for.', null],
    ['Tue', 'Walls. You learn to frame, and by afternoon the rooms have a shape.', '/iowa/baja/framing.jpg'],
    ['Wed', 'The roof goes on. Someone on your team finds out they’re not scared of heights.', null],
    ['Thu', 'Windows, doors, paint. Cuts on the saw, a lot of measuring twice.', '/iowa/baja/saw.jpg'],
    ['Fri', 'The family walks in. Your team prays over the house in the yard.', null],
  ];

  return (
    <div className={sans.className} style={{ background: '#fff' }}>
      {/* HERO: the photo stays clear; the words sit on a solid ink band under it */}
      <section>
        <div className="relative h-[46vh] md:h-[62vh] bg-[#1a2b3c]">
          <Image src="/iowa/baja/roof.jpg" alt="ARK Iowa students putting a roof on a home in Baja" fill priority sizes="100vw" className="object-cover object-[center_25%]" />
        </div>
        <div style={{ background: INK }} className="text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 md:pb-12">
            <p className={`${stencil.className} leading-[0.85] tracking-tight text-[22vw] md:text-[11rem] -mt-[9vw] md:-mt-20 relative`} style={{ color: '#fff' }}>
              June 13–19
            </p>
            <div className="mt-4 md:flex md:items-end md:justify-between md:gap-10">
              <div className="max-w-2xl">
                <h1 className="text-3xl md:text-5xl font-bold leading-tight">This summer, a family in Mexico moves into a home you built.</h1>
                <p className="mt-3 text-lg md:text-xl text-[#d9dde2]">One week in Baja with ARK Iowa, 2027.</p>
              </div>
              <div className="mt-6 md:mt-0 shrink-0 md:text-right">
                <HoldButton className="w-full md:w-auto" />
                <p className="mt-2 text-sm text-[#c4cad1]">A $200 deposit holds it.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOMEDAY: narrow text, left */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-2xl md:text-3xl leading-snug" style={navy}>You intend to serve God and people somewhere, someday.</p>
            <p className={`${body} mt-5`}>
              Maybe after graduation. Maybe once you have more money, or more time, or better Spanish. Maybe when going
              somewhere hard feels a little less scary than it does right now.
            </p>
            <p className={`${body} mt-5`}>Every summer fills up with a job, an internship, a trip home. Serving stays a plan you really do mean to get to.</p>
          </div>
          <p className="mt-12 md:ml-[30%] text-3xl md:text-5xl font-bold leading-tight max-w-3xl" style={navy}>
            Somehow someday never gets a date. So let’s put it on the calendar.
          </p>
        </div>
      </section>

      {/* THE WEEK: a real sequence, Monday to Friday. TODO(uReach): confirm the house is finished by Friday. */}
      <section style={{ background: LUMBER }} className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold max-w-xl" style={navy}>We’ll take you to Baja for a week and hand you a hammer.</h2>
          <ol className="mt-10 border-t-2 border-[var(--navy)] md:grid md:grid-cols-5">
            {week.map(([day, text, img]) => (
              <li key={day} className="pt-4 pb-6 md:pr-5 border-b border-[#c9b591] md:border-b-0">
                <p className={`${stencil.className} text-4xl`} style={navy}>{day}</p>
                <p className="mt-2 text-[#3d3a36]">{text}</p>
                {img && (
                  <div className="relative mt-4 aspect-[4/5] overflow-hidden rounded-sm">
                    <Image src={img} alt="" fill sizes="(min-width: 768px) 220px, 100vw" className="object-cover" />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FRIDAY: the scene, offset */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 md:grid md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7 md:col-start-4">
            <h2 className="text-3xl md:text-4xl font-bold" style={navy}>Friday afternoon</h2>
            <div className={`space-y-5 mt-6 ${body}`}>
              <p>
                On Monday it was a slab of concrete in a dirt lot. By Friday there are walls you framed, a roof you nailed
                down, and paint still drying on the door. A mom walks through that door with her kids behind her, and they
                start arguing over which room is theirs.
              </p>
              <p>
                Your whole team circles up in the yard and prays over the house. Your hands are blistered. Your shirt is
                ruined. You have never been this tired or this sure that God was in something.
              </p>
            </div>
            <p className="mt-8 text-2xl md:text-3xl font-bold" style={{ color: BARN }}>You find out what Jesus can do through your two hands.</p>
          </div>
        </div>
      </section>

      {/* WHERE YOU STAY: photos bleed, short caption */}
      <section className="pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-2">
          <div className="relative aspect-[16/10]"><Image src="/iowa/baja/base-night.jpg" alt="The uReach base courtyard at dusk" fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" /></div>
          <div className="relative aspect-[16/10] md:aspect-auto"><Image src="/iowa/baja/base-day.jpg" alt="The uReach base and dining hall" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" /></div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={`${body} mt-6 max-w-2xl`}>
            Home for the week is the uReach base in the San Quintín Valley. uReach connects teams with local churches and
            families, and they’ve built more than 170 homes and schools there since 2008. Besides the build, there’s usually
            a kids’ outreach, a Sunday with a local church, and a day at the beach. Every day we pray, worship, and talk
            through what God is doing.
          </p>
        </div>
      </section>

      {VIDEO_EMBED_URL && (
        <section className="pb-16">
          <div className="max-w-4xl mx-auto px-4 aspect-video">
            <iframe src={VIDEO_EMBED_URL} title="Baja Mission Trip 2027" className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </section>
      )}

      {/* PRAY */}
      <section className="py-16 md:py-20 text-white" style={{ background: INK }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 md:grid md:grid-cols-2 md:gap-14">
          <div>
            <p className="text-3xl md:text-4xl font-bold leading-tight">“Then I said, ‘Here am I. Send me!’”</p>
            <p className="mt-3 text-[#c4cad1]">Isaiah 6:8 NASB</p>
          </div>
          <div className="mt-8 md:mt-0">
            <h2 className="text-xl font-bold">Pray into it first</h2>
            <p className="mt-2 text-lg text-[#d9dde2]">Before money or schedules, ask the Father if he’s sending you. Pick the question that lands hardest:</p>
            <ul className="mt-4 space-y-3 text-lg text-white">
              <li>Where is God nudging you toward people who have never heard the gospel?</li>
              <li>What excuse or fear shows up first when you think about going? What would it look like to hand that to Jesus?</li>
              <li>Who could you ask to pray with you about this?</li>
            </ul>
          </div>
        </div>
      </section>

      {/* DETAILS + HOLD MY SPOT */}
      <section className="py-16 md:py-24" id="hold">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 md:grid md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h2 className="text-3xl md:text-4xl font-bold" style={navy}>Give someday a date.</h2>
            <dl className="mt-8 divide-y divide-[#e4dfd6]">
              {[
                ['When', 'Sunday, June 13 to Saturday, June 19, 2027.'],
                ['Travel', 'We fly into San Diego together (from Des Moines or Chicago). uReach vans take us to the base, about 4 hours south of the border, and back.'],
                ['Passport', 'You need a valid one. If you don’t have one, apply by January. It can take months.'],
                ['Cost', 'About $1,500 to raise: $927 to uReach (meals, lodging, vans, materials, insurance) plus your flight. Bring a little spending money too.'],
                ['Deposit', '$200 holds your spot. It’s your first fundraising goal.'],
              ].map(([k, v]) => (
                <div key={k} className="py-3 grid grid-cols-[6rem_1fr] gap-3">
                  <dt className="font-bold" style={navy}>{k}</dt>
                  <dd className="text-[#3d3a36]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-lg font-semibold" style={navy}>Money should never be the only reason you stay home.</p>
            <p className="text-[#3d3a36]">You won’t raise it alone. We’ll give you a support letter, a text to send, and walk it with you.</p>
          </div>
          <div className="md:col-span-7 mt-10 md:mt-0">
            <RegisterToGo />
            <details className="mt-8 group">
              <summary className="cursor-pointer text-lg font-semibold underline" style={navy}>Not sure yet? Ask a question first</summary>
              <div className="mt-4"><InterestForm /></div>
            </details>
            <p className="mt-6 text-[#3d3a36]">
              Rather talk? Call or text <a href={PHONE_HREF} className="font-semibold underline" style={navy}>{PHONE_DISPLAY}</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky action on phones */}
      <StickyHold />
    </div>
  );
}
