'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/navigation/AppHeader';
import { CREED_CARDS, CATEGORIES } from '@/lib/creedCardsData';

const STORAGE_KEY = 'creedcards_learned';

function getLearnedSet(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

function saveLearnedSet(set: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

/** Deterministic "Card of the Day" based on today's date */
function getCardOfTheDay(): number {
  const now = new Date();
  const dayIndex = (now.getFullYear() * 365 + now.getMonth() * 31 + now.getDate()) % CREED_CARDS.length;
  return dayIndex;
}

export default function CreedCardsPage() {
  const [currentIndex, setCurrentIndex] = useState(getCardOfTheDay);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setLearned(getLearnedSet());
  }, []);

  const filteredCards = activeCategory
    ? CREED_CARDS.filter(c => c.categorySlug === activeCategory)
    : CREED_CARDS;

  const card = filteredCards[currentIndex % filteredCards.length];
  if (!card) return null;

  const isLearned = learned.has(card.id);

  const goNext = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => (i + 1) % filteredCards.length), 150);
  }, [filteredCards.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => (i - 1 + filteredCards.length) % filteredCards.length), 150);
  }, [filteredCards.length]);

  const toggleLearned = useCallback(() => {
    setLearned(prev => {
      const next = new Set(prev);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else {
        next.add(card.id);
      }
      saveLearnedSet(next);
      // Dispatch storage event so FAB updates
      window.dispatchEvent(new Event('creedcards-updated'));
      return next;
    });
  }, [card.id]);

  const handleCategoryChange = useCallback((slug: string | null) => {
    setActiveCategory(slug);
    setCurrentIndex(0);
    setFlipped(false);
  }, []);

  return (
    <div className="creed-cards-page">
      <AppHeader />

      {/* Creed Cards Sub-header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-white">Creed Cards</h2>
          <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--ark-gold)', color: 'var(--ark-navy)' }}>
            {learned.size}/50
          </span>
        </div>
        <p className="text-white/50 text-sm">50 core truths of the Christian faith</p>
      </div>

      {/* Progress Bar */}
      <div className="creed-progress-bar">
        <div className="creed-progress-fill" style={{ width: `${(learned.size / 50) * 100}%` }} />
      </div>

      {/* Category Filter */}
      <div className="creed-category-filter">
        <button
          className={`creed-category-chip ${activeCategory === null ? 'active' : ''}`}
          onClick={() => handleCategoryChange(null)}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.slug}
            className={`creed-category-chip ${activeCategory === cat.slug ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="creed-card-wrapper">
        <div
          className={`creed-card ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setFlipped(f => !f); }}
        >
          {/* Front */}
          <div
            className="creed-card-face creed-card-front"
            style={{ background: `linear-gradient(135deg, ${card.colors.dark}, ${card.colors.dark}dd)` }}
          >
            <span
              className="card-category-badge"
              style={{ background: `${card.colors.accent}22`, color: card.colors.accent }}
            >
              {card.category}
            </span>
            <div className="card-icon">
              <svg viewBox="0 0 80 80" fill="none" stroke={card.colors.accent} strokeWidth="1.5" opacity="0.3">
                <circle cx="40" cy="40" r="30" />
                <path d="M40 20v40M20 40h40" />
              </svg>
            </div>
            <h2 className="card-title">{card.title}</h2>
            <p className="card-short-desc">{card.shortDesc}</p>
            <span className="card-number">Card {card.id} of 50</span>
            <span className="tap-hint">Tap to flip</span>
          </div>

          {/* Back */}
          <div className="creed-card-face creed-card-back">
            <div className="back-header">
              <div className="back-term" style={{ color: card.colors.dark }}>{card.originalTerm}</div>
              <div className="back-translation">
                {card.translation} ({card.termLanguage})
              </div>
              <span className="back-meaning" style={{ background: `${card.colors.accent}22`, color: card.colors.dark }}>
                {card.englishMeaning}
              </span>
            </div>

            <div className="back-section">
              <div className="back-section-label">Definition</div>
              <p className="back-definition">{card.definition}</p>
            </div>

            <div className="back-section">
              <div className="back-section-label">Scripture</div>
              <div className="back-scripture" style={{ background: card.colors.lightBg }}>
                <p>{card.scripture}</p>
                <span className="back-reference" style={{ color: card.colors.accent }}>
                  &mdash; {card.reference}
                </span>
              </div>
            </div>

            <div className="back-section">
              <div className="back-section-label">Historical Context</div>
              <p className="back-context">{card.historicalContext}</p>
            </div>

            <div className="back-section">
              <div className="back-section-label">Reflection</div>
              <p className="back-reflection">{card.reflection}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="creed-nav">
        <button className="creed-nav-btn" onClick={goPrev} aria-label="Previous card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="creed-nav-counter">
          {(currentIndex % filteredCards.length) + 1} / {filteredCards.length}
        </span>
        <button className="creed-nav-btn" onClick={goNext} aria-label="Next card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Mark as Learned Button */}
      <button
        className={`creed-learn-btn ${isLearned ? 'learned' : 'not-learned'}`}
        onClick={e => { e.stopPropagation(); toggleLearned(); }}
      >
        {isLearned ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Learned
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Mark as Learned
          </>
        )}
      </button>
    </div>
  );
}
