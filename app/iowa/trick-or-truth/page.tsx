import type { Metadata, Viewport } from 'next';
import { Anton } from 'next/font/google';
import OutreachSignup from '@/components/iowa/OutreachSignup';
import { slotCounts } from '@/lib/outreach';
import { TRICK_OR_TRUTH } from '@/lib/outreachFormat';

export const dynamic = 'force-dynamic';

const display = Anton({ weight: '400', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Trick or Truth — ARK Iowa',
  description: 'What’s your plan to talk about Jesus this Halloween? Join the Trick or Truth outreach team, Oct 29-31.',
};

export const viewport: Viewport = { themeColor: '#0A0A0B' };

// Volunteer sign-up for Trick or Truth. Standalone campaign page: no site nav
// (BrochureShell renders it bare), Spark palette. Copy is locked in
// ark-workspace/projects/ark-identity/trick-or-truth/volunteer-signup-PLAN.md.
const INK = '#0A0A0B';
const FIRE = '#FF5A1F';
const CREAM = '#FAF8F5';
const MUTED = '#c9c9cf';

export default async function TrickOrTruthPage() {
  const counts = await slotCounts(TRICK_OR_TRUTH).catch(() => ({}));

  return (
    <div style={{ background: INK, color: CREAM, minHeight: '100vh' }}>
      {/* Glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
        style={{ background: `radial-gradient(60% 50% at 50% 30%, ${FIRE}33, transparent 70%)` }}
      />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
        <header className="pt-6 flex items-center justify-between text-xs tracking-[0.2em] uppercase" style={{ color: MUTED }}>
          <span>ARK Iowa</span>
          <span>Oct 29–31</span>
        </header>

        {/* Hero */}
        <section className="pt-8 pb-16 text-center">
          <StampedBox />
          <h1 className={`${display.className} mt-10 text-[2.6rem] sm:text-6xl leading-[1.05] uppercase`}>
            What’s your plan to talk about <span style={{ color: FIRE }}>Jesus</span> this Halloween?
          </h1>
          <p className="mt-5 text-lg" style={{ color: MUTED }}>
            Two boxes of candy, one with a Bible verse inside. A student picks, you ask why, and the conversation starts.
          </p>
          <p className="mt-4 text-sm font-semibold tracking-[0.15em] uppercase" style={{ color: FIRE }}>
            Thu–Sat · 3–9 PM · On campus
          </p>
          <a
            href="#signup"
            className="mt-8 inline-block px-8 py-4 rounded-lg font-bold uppercase tracking-wide transition hover:opacity-90"
            style={{ backgroundColor: FIRE, color: INK }}
          >
            Save my spot
          </a>
        </section>

        {/* Story */}
        <section className="py-12 border-t space-y-4 text-xl leading-relaxed" style={{ borderColor: '#222226' }}>
          <p style={{ color: MUTED }}>Most of us have no idea how to approach a stranger.</p>
          <p>
            We give you two boxes and one simple question that sparks conversations about Jesus. Join the outreach team and share
            God’s truth with students.
          </p>
          <p className="font-bold" style={{ color: FIRE }}>
            You leave with a story of what God did on Halloween.
          </p>
        </section>

        {/* How it works */}
        <section className="py-12 border-t" style={{ borderColor: '#222226' }}>
          <h2 className={`${display.className} text-3xl uppercase mb-8`}>How it works</h2>
          <ol className="space-y-6">
            {[
              ['Save a spot', 'Pick one or more 2-hour times.'],
              ['Get your location', 'We’ll text you where to go before your time.'],
              ['Join a team', 'Watch it run once, then hold the boxes and ask the question yourself.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-5">
                <span className={`${display.className} text-4xl leading-none w-8 shrink-0`} style={{ color: FIRE }}>
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold text-lg">{title}</p>
                  <p style={{ color: MUTED }}>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Sign-up */}
        <section id="signup" className="py-12 border-t scroll-mt-6" style={{ borderColor: '#222226' }}>
          <h2 className={`${display.className} text-3xl uppercase mb-2`}>Join the outreach team</h2>
          <p className="mb-6" style={{ color: MUTED }}>
            Halloween is the one week strangers expect someone to walk up to them. Don’t let it pass.
          </p>
          <OutreachSignup initialCounts={counts} />
        </section>

        {/* Quick answers */}
        <section className="py-12 border-t" style={{ borderColor: '#222226' }}>
          <h2 className={`${display.className} text-3xl uppercase mb-6`}>Quick answers</h2>
          <dl className="space-y-5">
            {[
              ['Do I need training?', 'No. You’ll join a team that’s already running and see how it works.'],
              ['Can I bring a friend?', 'Yes. Tell us how many in the form.'],
              ['What if someone’s rude?', 'Smile, thank them, and move on. Most people are curious.'],
              ['Under 18?', 'Come with a parent or a leader.'],
            ].map(([q, a]) => (
              <div key={q}>
                <dt className="font-bold">{q}</dt>
                <dd style={{ color: MUTED }}>{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="py-10 text-center text-xs tracking-[0.2em] uppercase" style={{ color: '#6b6b72' }}>
          ARK Iowa · Questions? Text (319) 359-7117
        </footer>
      </div>
    </div>
  );
}

// Stand-in for the real box photos until Travis sends them.
/** Travis's box with the Trick or Truth logo stamped on its front face (10/24: the logo as a rubber stamp, no labels) */
function StampedBox() {
  return (
    <div className="relative mx-auto w-72 sm:w-96" style={{ filter: `drop-shadow(0 24px 40px #000c) drop-shadow(0 0 50px ${FIRE}33)` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static art */}
      <img src="/iowa/trick-or-truth/box.png" alt="" width={640} height={505} className="block w-full h-auto" />
      {/* the stamp, centered on the front face and inked into the cardboard */}
      <div className="absolute" style={{ left: '58.5%', top: '58%', width: '52%', transform: 'translate(-50%, -50%) rotate(-7deg)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
        <img src="/iowa/trick-or-truth/logo.png" alt="Trick or Truth" width={240} height={240} className="block w-full h-auto"
          style={{ mixBlendMode: 'multiply', filter: 'brightness(0.82) saturate(1.35)' }} />
      </div>
    </div>
  );
}
