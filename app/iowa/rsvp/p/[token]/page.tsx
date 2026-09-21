import type { Metadata } from 'next';
import { personalView } from '@/lib/eventInvites';
import PersonalRsvp from '@/components/iowa/PersonalRsvp';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — you’re invited', robots: { index: false, follow: false } };

// One person's private invite (a one-on-one, or a personal nudge).
export default async function PersonalRsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const v = await personalView(token);
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 py-14">
        {!v ? (
          <p className="text-lg" style={{ color: 'var(--navy)' }}>That invite link doesn’t work anymore.</p>
        ) : (
          <>
            <p className="text-lg text-[#4a4540] mb-1">Hey {v.name}! You’re invited:</p>
            <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>{v.title}</h1>
            <p className="text-[#4a4540] mb-8">{v.when}{v.where ? ` · ${v.where}` : ''}</p>
            <PersonalRsvp token={token} current={v.response} />
          </>
        )}
      </div>
    </div>
  );
}
