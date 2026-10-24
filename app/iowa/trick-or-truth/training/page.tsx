import type { Metadata, Viewport } from 'next';
import { Anton } from 'next/font/google';

const display = Anton({ weight: '400', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Trick or Truth training — ARK Iowa',
  description: 'Everything you need before you head out for Trick or Truth.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#0A0A0B' };

// Volunteer training. Plan: ark-workspace/projects/ark-identity/trick-or-truth/training-page-PLAN.md.
// Paste the YouTube link here once the video is recorded; until then a placeholder shows.
const VIDEO_URL = '';

const INK = '#0A0A0B';
const FIRE = '#FF5A1F';
const MUTED = '#c9c9cf';
const LINE = '#222226';

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
}

export default function TrainingPage() {
  const embed = VIDEO_URL ? youtubeEmbed(VIDEO_URL) : null;

  return (
    <div style={{ background: INK, color: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <header className="pt-6 flex items-center justify-between text-xs tracking-[0.2em] uppercase" style={{ color: MUTED }}>
          <a href="/iowa/trick-or-truth">Trick or Truth</a>
          <span>Training</span>
        </header>

        <section className="pt-10 pb-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
          <img src="/iowa/trick-or-truth/logo.png" alt="Trick or Truth" width={180} height={180} className="w-36 sm:w-44 h-auto mb-6 -ml-2" />
          <h1 className={`${display.className} text-5xl uppercase leading-none`}>
            Here’s how <span style={{ color: FIRE }}>it works</span>
          </h1>
          <p className="mt-4 text-lg" style={{ color: MUTED }}>
            Watch the video, skim the rest, and you’re ready. Ten minutes, tops.
          </p>
        </section>

        {/* Video */}
        <section className="pb-10">
          {embed ? (
            <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={embed}
                title="Trick or Truth training"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              />
            </div>
          ) : (
            <div
              className="w-full rounded-xl flex flex-col items-center justify-center text-center px-6"
              style={{ aspectRatio: '16 / 9', border: `1px dashed ${FIRE}`, background: '#111113' }}
            >
              <span className={`${display.className} text-2xl uppercase`} style={{ color: FIRE }}>
                Video coming soon
              </span>
              <span className="mt-1 text-sm" style={{ color: MUTED }}>
                A 3-minute walkthrough of a real conversation.
              </span>
            </div>
          )}
        </section>

        <Section n={1} title="The flow">
          <ol className="space-y-3">
            <Step>
              Stand off to the side of foot traffic, not in the middle of it. Hold out both boxes: <Q>Trick or Truth?</Q>
            </Step>
            <Step>Let them reach in and grab candy. Don’t rush it; the picking is the fun part.</Step>
            <Step>
              <Q>Why’d you pick that one?</Q> Whatever they say, smile. There’s no wrong answer.
            </Step>
            <Step>
              Truth box: <Q>Would you read that verse out loud for us?</Q> Trick box: <Q>Want to see what’s in the other one?</Q>
            </Step>
            <Step>
              <Q>What do you think about that?</Q> Then listen. Really listen. Most people have never been asked.
            </Step>
          </ol>
        </Section>

        <Section n={2} title="Team roles">
          <ul className="space-y-3">
            <Item label="Box holder">Offers the boxes and keeps things moving.</Item>
            <Item label="Talker">Asks the questions and listens.</Item>
            <Item label="Third person">Prays quietly and keeps an eye on the team.</Item>
          </ul>
          <p className="mt-4" style={{ color: MUTED }}>
            Swap roles every 20 minutes. Never go out alone.
          </p>
        </Section>

        <Section n={3} title="Keep it going">
          <ul className="space-y-2 mb-6">
            {[
              'Do you have a faith background?',
              'Where are you at with God right now?',
              'Have you ever read the Bible for yourself?',
              'What do you think about Jesus?',
              'Can I share why that verse matters to me?',
              'Is there anything we could pray for you about?',
            ].map((q) => (
              <li key={q}>
                <Q>{q}</Q>
              </li>
            ))}
          </ul>
          <h3 className="font-bold mb-3">When they say…</h3>
          <div className="space-y-4">
            {[
              ['I’m not religious.', 'Totally fine. What do you think about that verse anyway?'],
              ['I grew up in church.', 'What’s your faith like now?'],
              ['(A question you can’t answer)', 'Great question. I don’t know, but I’d love to look into it with you.'],
              ['Are you trying to convert me?', 'Ha, no. We just love talking about Jesus. Pick a box?'],
            ].map(([they, you]) => (
              <div key={they} className="rounded-lg p-4" style={{ background: '#111113', border: `1px solid ${LINE}` }}>
                <p style={{ color: MUTED }}>{they}</p>
                <p className="mt-1 font-semibold">
                  <span style={{ color: FIRE }}>You: </span>
                  {you}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section n={4} title="Your 30-second story">
          <p style={{ color: MUTED }}>Before you go, write yours in three lines:</p>
          <ol className="mt-3 space-y-2">
            <Step>What life was like before Jesus.</Step>
            <Step>How you met Him.</Step>
            <Step>What’s different now.</Step>
          </ol>
          <p className="mt-4" style={{ color: MUTED }}>
            Keep it short and real. Their story matters more than yours; share yours when they ask or when it fits.
          </p>
        </Section>

        <Section n={5} title="The invitation">
          <p>
            If they’re open, point to the QR on their slip: <Q>A few of us read the Bible with other students each week. Want in?</Q>
          </p>
          <p className="mt-3" style={{ color: MUTED }}>
            Help them scan it right there; later never happens. Then offer to pray: <Q>Can I pray for you real quick?</Q> Keep it
            short, eyes open is fine.
          </p>
        </Section>

        <Section n={6} title="When it gets hard">
          <ul className="space-y-3">
            <Item label="Rude or arguing">Smile, thank them, move on. You don’t have to win the argument.</Item>
            <Item label="Drunk or unsafe">Walk away and find your team.</Item>
            <Item label="Kids and minors">Candy is fine. Keep conversations with a parent nearby.</Item>
            <Item label="Allergies">Candy is wrapped and sealed, but we can’t vouch for allergens. Let them read the label.</Item>
            <Item label="Someone in crisis">
              Stay with them and text (319) 359-7117. If they’re in danger, call or text 988, or 911.
            </Item>
          </ul>
        </Section>

        <Section n={7} title="Before you go">
          <ul className="space-y-2">
            {[
              'Phone charged',
              'Scripture slips counted',
              'Both boxes topped off with candy',
              'Hand sanitizer',
              'You know your location and your teammates',
              'Your 30-second story, written down',
            ].map((x) => (
              <li key={x} className="flex gap-3">
                <span style={{ color: FIRE }}>☐</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section n={8} title="After">
          <p>Fill out the two-minute debrief tonight. The stories matter most.</p>
          <a
            href="/iowa/trick-or-truth/debrief"
            className="mt-5 inline-block px-6 py-3 rounded-lg font-bold uppercase tracking-wide transition hover:opacity-90"
            style={{ backgroundColor: FIRE, color: INK }}
          >
            Open the debrief
          </a>
        </Section>

        <footer className="py-10 text-center text-xs tracking-[0.2em] uppercase" style={{ color: '#6b6b72' }}>
          ARK Iowa · Questions? Text (319) 359-7117
        </footer>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="py-10 border-t" style={{ borderColor: LINE }}>
      <h2 className={`${display.className} text-3xl uppercase mb-5 flex gap-4`}>
        <span style={{ color: FIRE }}>{n}</span>
        {title}
      </h2>
      <div className="text-lg leading-relaxed">{children}</div>
    </section>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return <li className="pl-1 list-decimal list-inside">{children}</li>;
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li>
      <span className="font-bold">{label}: </span>
      <span style={{ color: MUTED }}>{children}</span>
    </li>
  );
}

function Q({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold">“{children}”</span>;
}
