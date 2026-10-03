export const metadata = {
  title: 'Terms of Use - ARK Identity',
  description: 'The terms for using the ARK Identity website and content.',
};

const UPDATED = 'October 2, 2026';
const CONTACT = 'info@arkidentity.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--navy)' }}>{title}</h2>
      <div className="space-y-4 text-lg leading-relaxed" style={{ color: '#4a4540' }}>{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div style={{ background: '#FAF8F5' }}>
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Terms of Use</h1>
          <p className="text-gray-300">Last updated {UPDATED}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Section title="Welcome">
          <p>
            This website is run by ARK Identity, a discipleship ministry. By using arkidentity.com, you agree to these
            terms. If you don’t agree, please don’t use the site.
          </p>
        </Section>

        <Section title="Using our content">
          <p>
            Our teachings, videos, notes, and other materials are here to help you grow in your faith. You’re welcome to
            watch, read, and share links to them. Please don’t sell our content or republish it as your own without asking
            us first.
          </p>
        </Section>

        <Section title="Videos and YouTube">
          <p>
            Our teaching videos, including Friday Fill Up, are hosted on our YouTube channel and shown on this site through
            YouTube. By watching them, you also agree to the{' '}
            <a href="https://www.youtube.com/t/terms" className="underline" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>,
            and Google’s use of information is covered by the{' '}
            <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
          </p>
        </Section>

        <Section title="Forms and sign-ups">
          <p>
            When you sign up for a study, an event, a trip, or updates, please give accurate information. We’ll use it as
            described in our <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>
        </Section>

        <Section title="Giving">
          <p>
            Gifts are processed by our giving partners on their own secure pages and are subject to their terms. Gifts are
            received through our fiscal sponsor, Global Service Associates, a 501(c)(3), which provides tax receipts.
          </p>
        </Section>

        <Section title="Be kind">
          <p>
            Please don’t misuse the site: no attempts to break it, access what isn’t yours, send spam, or harass anyone
            through our forms or events.
          </p>
        </Section>

        <Section title="No guarantees">
          <p>
            We do our best to keep the site accurate and running, but it’s provided “as is.” Our teaching is offered for
            spiritual encouragement and isn’t professional medical, legal, financial, or counseling advice. To the extent
            the law allows, ARK Identity isn’t liable for losses that come from using the site.
          </p>
        </Section>

        <Section title="Links to other sites">
          <p>We link to other sites, like YouTube and our giving partners. We’re not responsible for their content or practices.</p>
        </Section>

        <Section title="Changes and questions">
          <p>
            We may update these terms and will change the date at the top when we do. Questions? Email{' '}
            <a href={`mailto:${CONTACT}`} className="underline">{CONTACT}</a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
