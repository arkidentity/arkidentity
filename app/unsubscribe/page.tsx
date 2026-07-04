import { unsubscribeByToken } from '@/lib/partners';

export const metadata = { title: 'Unsubscribed - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await unsubscribeByToken(token).catch(() => false) : false;

  return (
    <div style={{ background: '#FAF8F5', minHeight: '70vh' }} className="flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
          {ok ? 'You’ve been unsubscribed' : 'Link not recognized'}
        </h1>
        <p className="text-lg" style={{ color: '#5a5247' }}>
          {ok
            ? "You won't receive any more ministry update emails. We're grateful for the season you walked with us."
            : 'This unsubscribe link is invalid. If you keep receiving emails, reply to one and let us know.'}
        </p>
      </div>
    </div>
  );
}
