import { CreedCardsProvider } from '@creed-cards/components/CreedCardsProvider';
import { GoDeeperPage } from '@creed-cards/components/cards/GoDeeperPage';

/**
 * Where a printed Creed Card's QR code lands: /cc/<deck>-<card> (e.g. /cc/1-25).
 * Public, and kept outside /creed-cards so the short link stays short.
 */
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <CreedCardsProvider basePath="/creed-cards">
      <GoDeeperPage code={code} />
    </CreedCardsProvider>
  );
}
