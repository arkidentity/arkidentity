export const metadata = {
  title: 'Privacy Policy - ARK Identity',
  description: 'What ARK Identity collects on this website, how we use it, and the choices you have.',
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

export default function Privacy() {
  return (
    <div style={{ background: '#FAF8F5' }}>
      <section className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Privacy Policy</h1>
          <p className="text-gray-300">Last updated {UPDATED}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Section title="The short version">
          <p>
            ARK Identity is a discipleship ministry. We collect only what we need to stay in touch with you and run our
            ministry. We don’t sell your information, we don’t run ads, and we don’t use tracking cookies.
          </p>
        </Section>

        <Section title="What we collect">
          <p>Only what you choose to give us through a form on this site, such as when you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>sign up for updates (your name and email)</li>
            <li>join or RSVP to an ARK Iowa Bible study or event (your name, email, phone number, school year, and the times that work for you)</li>
            <li>tell us you’re interested in a trip, like the Baja mission trip (your name, email, phone, school year, and anything you write to us)</li>
            <li>are invited to an event or added to our contacts by our team because you’ve connected with the ministry</li>
          </ul>
          <p>
            For students in an ARK Iowa study, our leaders also keep simple records like attendance and which study you’re
            in, so we can follow up and care for you well.
          </p>
          <p>
            Like nearly every website, our hosting provider automatically records basic technical information (such as
            your IP address and browser type) to keep the site running and secure.
          </p>
        </Section>

        <Section title="How we use it">
          <ul className="list-disc pl-6 space-y-2">
            <li>to send what you asked for: updates, confirmations, reminders, and schedule changes</li>
            <li>to contact you by email, text, or phone about the study, event, or trip you signed up for</li>
            <li>to plan and run our studies, events, and trips</li>
          </ul>
          <p>We never sell, rent, or trade your information.</p>
        </Section>

        <Section title="Who helps us run the site">
          <p>We use a few trusted services that handle information only to do their job for us:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Vercel</strong> hosts this website.</li>
            <li><strong>Supabase</strong> stores the information you submit.</li>
            <li><strong>Resend</strong> sends our emails.</li>
            <li>
              <strong>DonorView</strong> and <strong>Square</strong> process gifts. When you give, you enter payment details
              on their secure forms, not ours. We never see or store your card number.
            </li>
            <li><strong>YouTube</strong> plays the videos embedded on our pages, under YouTube’s own privacy policy.</li>
          </ul>
        </Section>

        <Section title="Our YouTube channel">
          <p>
            We use the YouTube API to upload our own teaching videos to the ARK Identity YouTube channel. This only touches
            our own channel and videos. It does not access, collect, or store information about you or anyone who watches.
            Use of YouTube is covered by the{' '}
            <a href="https://www.youtube.com/t/terms" className="underline" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>{' '}
            and the{' '}
            <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
          </p>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc pl-6 space-y-2">
            <li>Every email we send has an unsubscribe link.</li>
            <li>Reply “STOP” to any text, or just ask us to stop texting you.</li>
            <li>
              Email us at <a href={`mailto:${CONTACT}`} className="underline">{CONTACT}</a> to see, correct, or delete the
              information we have about you.
            </li>
          </ul>
        </Section>

        <Section title="Keeping it safe">
          <p>
            Only our ministry team can see the information you share, and access is protected by login. We keep it as long
            as we need it for the ministry, and delete it when you ask.
          </p>
        </Section>

        <Section title="Children">
          <p>This site is meant for adults and college students. We don’t knowingly collect information from children under 13.</p>
        </Section>

        <Section title="Changes and questions">
          <p>
            If we change this policy, we’ll update the date at the top of this page. Questions? Email{' '}
            <a href={`mailto:${CONTACT}`} className="underline">{CONTACT}</a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
