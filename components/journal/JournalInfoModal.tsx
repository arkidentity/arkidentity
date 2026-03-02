'use client';

/**
 * JournalInfoModal - "What is the 3D Journal?" tutorial/info modal
 * Styled to match the unified dark card theme (CARD_BG, accent vars, no per-dimension colors).
 */

import { useEffect } from 'react';

// Matches the card background used in ScriptureHero / DimensionCard
const CARD_BG = 'color-mix(in srgb, var(--primary-color) 88%, white 12%)';
// Almost-black surface for inset blocks (matches textarea bg)
const INSET_BG = 'color-mix(in srgb, var(--primary-color) 10%, black 90%)';

export interface JournalInfoModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
}

export function JournalInfoModal({ isOpen, onClose }: JournalInfoModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Modal */}
      <div
        className="
          relative w-full sm:max-w-lg
          max-h-[92vh] sm:max-h-[85vh]
          flex flex-col
          rounded-t-2xl sm:rounded-2xl
          overflow-hidden
          shadow-2xl
        "
        style={{
          background: `radial-gradient(ellipse at 110% 110%, color-mix(in srgb, var(--accent-color) 12%, transparent) 0%, transparent 60%), ${CARD_BG}`,
          borderTop: '1px solid color-mix(in srgb, var(--accent-color) 35%, transparent)',
          borderLeft: '1px solid color-mix(in srgb, var(--accent-color) 35%, transparent)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[.08] shrink-0">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0"
              style={{ color: 'var(--accent-color)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <h2 className="text-white font-semibold text-base">What is the 3D Journal?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white/50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Intro */}
          <p className="text-white/70 text-sm leading-relaxed">
            The 3D Bible Study method helps you move beyond just reading Scripture to truly
            understanding and living it out. Each dimension builds on the previous one,
            creating a complete approach to engaging with God&apos;s Word.
          </p>

          {/* Dimension sections */}
          <DimensionInfo
            badge="1D"
            title="HEAD"
            subtitle="Information"
            question="What is this passage saying?"
            description="Start by examining the text objectively. What is the historical context? Who is the audience? What theological truths are being revealed? This is about understanding the facts and meaning of the passage."
            prompts={[
              'What is the main point of this passage?',
              'What words or phrases stand out?',
              'What does this reveal about God?',
            ]}
          />

          <div className="border-t border-white/[.06]" />

          <DimensionInfo
            badge="2D"
            title="HEART"
            subtitle="Transformation"
            question="God, what are You saying to me?"
            description="Now make it personal. This is where you listen for God&apos;s voice speaking to your specific situation. Where is the Spirit convicting, encouraging, or challenging you through this text?"
            prompts={[
              'How does this apply to my life right now?',
              'What emotions or convictions am I feeling?',
              'What is God revealing about Himself to me?',
            ]}
          />

          <div className="border-t border-white/[.06]" />

          <DimensionInfo
            badge="3D"
            title="HANDS"
            subtitle="Activation"
            question="God, what action do You want me to take?"
            description="Faith without action is incomplete. What specific, practical step is God asking you to take? Be concrete — who, what, when? This is where Scripture moves from your head to your hands."
            prompts={[
              'What specific action should I take?',
              'Who do I need to talk to or serve?',
              'When and how will I do this?',
            ]}
          />

          {/* Scripture quote */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: INSET_BG }}
          >
            <p className="text-white/65 text-sm italic leading-relaxed">
              &ldquo;But be doers of the word, and not hearers only, deceiving yourselves.&rdquo;
            </p>
            <p className="text-white/35 text-xs mt-2">— James 1:22</p>
          </div>

        </div>

        {/* Footer — corner pill style matching DimensionCard save button */}
        <div className="shrink-0 border-t border-white/[.08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex items-center gap-1.5
              px-6 py-3
              rounded-tl-xl
              font-semibold text-sm
              transition-opacity hover:opacity-90
            "
            style={{
              backgroundColor: 'var(--accent-color)',
              color: 'color-mix(in srgb, var(--primary-color) 85%, black 15%)',
            }}
          >
            Start Journaling
          </button>
        </div>
      </div>
    </div>
  );
}

interface DimensionInfoProps {
  badge: string;
  title: string;
  subtitle: string;
  question: string;
  description: string;
  prompts: string[];
}

function DimensionInfo({
  badge,
  title,
  subtitle,
  question,
  description,
  prompts,
}: DimensionInfoProps) {
  return (
    <div className="space-y-3">
      {/* Badge + title row */}
      <div className="flex items-center gap-3">
        {/* Circle badge — filled accent, matches DimensionCard active state */}
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2"
          style={{
            backgroundColor: 'var(--accent-color)',
            borderColor: 'var(--accent-color)',
            color: 'color-mix(in srgb, var(--primary-color) 85%, black 15%)',
          }}
        >
          {badge}
        </span>
        <div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-white/45 text-xs">{subtitle}</p>
        </div>
      </div>

      {/* Guiding question */}
      <p
        className="font-medium text-sm pl-[52px]"
        style={{ color: 'var(--accent-color)' }}
      >
        {question}
      </p>

      {/* Description */}
      <p className="text-white/65 text-sm leading-relaxed pl-[52px]">
        {description}
      </p>

      {/* Prompt bullets */}
      <ul className="pl-[52px] space-y-1">
        {prompts.map((prompt, i) => (
          <li key={i} className="text-white/45 text-xs flex items-start gap-2">
            <span style={{ color: 'var(--accent-color)' }}>•</span>
            {prompt}
          </li>
        ))}
      </ul>
    </div>
  );
}
