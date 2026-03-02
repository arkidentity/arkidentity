import { PrayerProvider, PrayerPage } from '@/components/prayer';
import '@/styles/prayer.css';

export const metadata = {
  title: '4D Prayer | ARK Identity',
  description: 'A structured approach to meeting with God through Revere, Reflect, Request, and Rest.',
};

export default function Prayer() {
  return (
    <PrayerProvider>
      <PrayerPage />
    </PrayerProvider>
  );
}
