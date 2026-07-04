import { confirmSubscriber } from '@/lib/partners';

export const metadata = { title: 'Subscription confirmed - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await confirmSubscriber(token).catch(() => false) : false;

  return (
    <div style={{ background: '#FAF8F5', minHeight: '70vh' }} className="flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
          {ok ? "You're in." : 'Link expired'}
        </h1>
        <p className="text-lg mb-6" style={{ color: '#5a5247' }}>
          {ok
            ? "Your subscription is confirmed. You'll start receiving ministry updates from ARK Identity."
            : "This confirmation link is invalid or has already been used. Try subscribing again."}
        </p>
        <a href="/feed" className="inline-block px-6 py-3 rounded-lg font-semibold" style={{ backgroundColor: 'var(--navy)', color: 'white' }}>
          Go to the feed
        </a>
      </div>
    </div>
  );
}
