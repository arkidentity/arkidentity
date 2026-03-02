'use client';

import { usePrayer } from './PrayerContext';
import { PrayerBackground } from './PrayerBackground';
import { EnterGate } from './EnterGate';
import { PrayerDashboard } from './PrayerDashboard';
import { PrayerSession } from './PrayerSession';
import { MyCards } from './MyCards';
import { PrayerCompletion } from './PrayerCompletion';
import { PrayerInfoModal } from './PrayerInfoModal';
import { ActivationDetail } from './ActivationDetail';
import { GuidedActivationsList } from './GuidedActivationsList';

export function PrayerPage() {
  const { state } = usePrayer();

  if (state.isLoading) {
    return (
      <div className={`prayer-container theme-${state.theme}`}>
        <PrayerBackground />
        <div className="prayer-content" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (state.currentView) {
      case 'gate':
        return <EnterGate />;
      case 'dashboard':
        return <PrayerDashboard />;
      case 'session':
        return <PrayerSession />;
      case 'my-cards':
        return <MyCards />;
      case 'completion':
        return <PrayerCompletion />;
      case 'activation-detail':
        return <ActivationDetail />;
      case 'guided-activations':
        return <GuidedActivationsList />;
      default:
        return <EnterGate />;
    }
  };

  return (
    <div className={`prayer-container theme-${state.theme}`}>
      <PrayerBackground />
      <div className="prayer-content">
        {renderView()}
      </div>
      <PrayerInfoModal />
    </div>
  );
}
