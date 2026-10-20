import type { Metadata } from 'next';
import OutreachSignup from '@/components/iowa/OutreachSignup';
import { slotCounts } from '@/lib/outreach';
import { TRICK_OR_TRUTH } from '@/lib/outreachFormat';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Trick or Truth — ARK Iowa',
  description: 'What’s your plan to talk about Jesus this Halloween? Join the Trick or Truth outreach team, Oct 29-31.',
};

// Volunteer sign-up for Trick or Truth. Copy is locked in
// ark-workspace/projects/ark-identity/trick-or-truth/volunteer-signup-PLAN.md.
export default async function TrickOrTruthPage() {
  const counts = await slotCounts(TRICK_OR_TRUTH).catch(() => ({}));
  const navy = { color: 'var(--navy)' };

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 space-y-14">
        <section>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={navy}>
            What’s your plan to talk about Jesus this Halloween?
          </h1>
          <p className="text-lg text-[#4a4540] mb-2">
            Two boxes of candy, one with a Bible verse inside. A student picks, you ask why, and the conversation starts.
          </p>
          <p className="font-semibold mb-6" style={navy}>
            Thu–Sat, Oct 29–31 · 3–9 PM · on campus
          </p>
          <a
            href="#signup"
            className="inline-block px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
          >
            Save my spot
          </a>
        </section>

        <section className="space-y-3 text-lg text-[#4a4540]">
          <p>Most of us have no idea how to approach a stranger.</p>
          <p>
            We give you two boxes and one simple question that sparks conversations about Jesus. Join the outreach team and
            share God’s truth with students.
          </p>
          <p className="font-semibold" style={navy}>
            You leave with a story of what God did on Halloween.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5" style={navy}>
            How it works
          </h2>
          <ol className="space-y-4">
            {[
              ['Save a spot', 'Pick one or more 2-hour times.'],
              ['Get your location', 'We’ll text you where to go before your time.'],
              ['Join a team', 'Watch it run once, then hold the boxes and ask the question yourself.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                  style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold" style={navy}>
                    {title}
                  </p>
                  <p className="text-[#4a4540]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="signup" className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-2" style={navy}>
            Join the outreach team
          </h2>
          <p className="text-[#4a4540] mb-6">Halloween is the one week strangers expect someone to walk up to them. Don’t let it pass.</p>
          <OutreachSignup initialCounts={counts} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5" style={navy}>
            Quick answers
          </h2>
          <dl className="space-y-4 text-[#4a4540]">
            {[
              ['Do I need training?', 'No. You’ll join a team that’s already running and see how it works.'],
              ['Can I bring a friend?', 'Yes. Tell us how many in the form.'],
              ['What if someone’s rude?', 'Smile, thank them, and move on. Most people are curious.'],
              ['Under 18?', 'Come with a parent or a leader.'],
            ].map(([q, a]) => (
              <div key={q}>
                <dt className="font-semibold" style={navy}>
                  {q}
                </dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
