'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrayer } from './PrayerContext';
import { MusicBar } from './MusicBar';

export function PrayerSession() {
  const {
    state,
    nextCard,
    prevCard,
    pauseSession,
    resumeSession,
    endSession,
  } = usePrayer();

  const [fadeOut, setFadeOut] = useState(false);

  const currentCard = state.session?.cards[state.currentCardIndex];
  const totalCards = state.session?.cards.length || 0;
  const progress = ((state.currentCardIndex + 1) / totalCards) * 100;

  // Handle card transitions
  const handleNextCard = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      nextCard();
      setFadeOut(false);
    }, 300);
  }, [nextCard]);

  const handlePrevCard = useCallback(() => {
    if (state.currentCardIndex > 0) {
      setFadeOut(true);
      setTimeout(() => {
        prevCard();
        setFadeOut(false);
      }, 300);
    }
  }, [prevCard, state.currentCardIndex]);

  // Auto-advance when card time is up
  useEffect(() => {
    if (!state.session || state.isPaused) return;

    const cardStartTime = state.session.cards
      .slice(0, state.currentCardIndex)
      .reduce((acc, card) => acc + card.duration, 0);

    const cardEndTime = cardStartTime + (currentCard?.duration || 0);
    const elapsed = state.session.totalDuration - state.timeRemaining;

    if (elapsed >= cardEndTime && state.currentCardIndex < totalCards - 1) {
      handleNextCard();
    } else if (state.timeRemaining <= 0) {
      endSession(true);
    }
  }, [state.timeRemaining, state.isPaused, state.currentCardIndex, currentCard, totalCards, state.session, handleNextCard, endSession]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === 'Escape') {
        endSession(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextCard, handlePrevCard, endSession]);

  // Swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextCard();
    } else if (isRightSwipe) {
      handlePrevCard();
    }
  };

  if (!currentCard) return null;

  return (
    <>
      <MusicBar showTimer={true} showThemeSelector={false} />

      <div
        className="prayer-session"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Progress Dots */}
        <div className="progress-dots">
          {state.session?.cards.slice(0, Math.min(20, totalCards)).map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${
                index === state.currentCardIndex
                  ? 'active'
                  : index < state.currentCardIndex
                  ? 'completed'
                  : ''
              }`}
            />
          ))}
          {totalCards > 20 && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
              +{totalCards - 20}
            </span>
          )}
        </div>

        {/* Prayer Card */}
        <div className="prayer-card-container">
          <div className={`prayer-session-card glass-card-elevated ${fadeOut ? 'fade-out' : ''}`}>
            {/* Type Badge */}
            <div className={`card-type-badge ${currentCard.type.toLowerCase()}`}>
              {currentCard.type}
              {currentCard.totalOfType > 0 && (
                <span> {currentCard.cardNumber}/{currentCard.totalOfType}</span>
              )}
            </div>

            {/* Content */}
            <p className="card-content">{currentCard.content}</p>

            {/* Sub-prompt */}
            {currentCard.subPrompt && (
              <p className="card-sub-prompt">{currentCard.subPrompt}</p>
            )}

            {/* Scripture */}
            {currentCard.scripture && (
              <div className="card-scripture">
                <p className="scripture-text">{currentCard.scripture}</p>
                {currentCard.scriptureRef && (
                  <p className="scripture-ref">— {currentCard.scriptureRef}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="prayer-nav-controls">
          <div className="nav-pill">
            {/* Exit Button */}
            <button
              className="nav-btn exit-btn"
              onClick={() => endSession(false)}
              aria-label="Exit session"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="nav-pill-divider" />

            {/* Previous */}
            <button
              className="nav-btn"
              onClick={handlePrevCard}
              disabled={state.currentCardIndex === 0}
              aria-label="Previous card"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Pause/Play */}
            <button
              className="nav-btn pause-btn"
              onClick={state.isPaused ? resumeSession : pauseSession}
              aria-label={state.isPaused ? 'Resume' : 'Pause'}
            >
              {state.isPaused ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              className="nav-btn"
              onClick={handleNextCard}
              aria-label="Next card"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
