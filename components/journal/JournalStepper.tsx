'use client';

/**
 * JournalStepper - 1D → 2D → 3D progress indicator
 * Circles are tappable — each opens an info popup for that dimension.
 * Future circles have a staggered breathing animation as a tutorial hint.
 * Entire section is collapsible with localStorage persistence.
 */

import { useState, useEffect } from 'react';
import type { DimensionType } from '@/types/journal';

interface JournalStepperProps {
  activeStep: DimensionType;
}

const CARD_BG = 'color-mix(in srgb, var(--primary-color) 88%, white 12%)';
const STORAGE_KEY = 'journal-stepper-collapsed';
const DISMISSED_KEY = 'journal-stepper-dismissed';

const STEPS = [
  {
    id: 'head' as DimensionType,
    badge: '1D',
    label: 'HEAD',
    subtitle: 'Information',
    question: 'What is this passage saying?',
    description:
      'Start by examining the text objectively. What is the historical context? Who is the audience? What theological truths are being revealed? This is about understanding the facts and meaning of the passage.',
    prompts: [
      'What is the main point of this passage?',
      'What words or phrases stand out?',
      'What does this reveal about God?',
    ],
  },
  {
    id: 'heart' as DimensionType,
    badge: '2D',
    label: 'HEART',
    subtitle: 'Transformation',
    question: 'God, what are You saying to me?',
    description:
      "Now make it personal. This is where you listen for God\u2019s voice speaking to your specific situation. Where is the Spirit convicting, encouraging, or challenging you through this text?",
    prompts: [
      'How does this apply to my life right now?',
      'What emotions or convictions am I feeling?',
      'What is God revealing about Himself to me?',
    ],
  },
  {
    id: 'hands' as DimensionType,
    badge: '3D',
    label: 'HANDS',
    subtitle: 'Activation',
    question: 'God, what action do You want me to take?',
    description:
      "Faith without action is incomplete. What specific, practical step is God asking you to take? Be concrete \u2014 who, what, when? This is where Scripture moves from your head to your hands.",
    prompts: [
      'What specific action should I take?',
      'Who do I need to talk to or serve?',
      'When and how will I do this?',
    ],
  },
];

const STEP_INDEX: Record<DimensionType, number> = { head: 0, heart: 1, hands: 2 };

// Breathing animation delays per circle (staggered ripple)
const BREATHE_DELAYS = ['0s', '2s', '4s'];

type StepState = 'active' | 'past' | 'future';

function getStepState(stepId: DimensionType, activeStep: DimensionType): StepState {
  const idx = STEP_INDEX[stepId];
  const activeIdx = STEP_INDEX[activeStep];
  if (idx === activeIdx) return 'active';
  if (idx < activeIdx) return 'past';
  return 'future';
}

export function JournalStepper({ activeStep }: JournalStepperProps) {
  const activeIdx = STEP_INDEX[activeStep];
  const [activeDim, setActiveDim] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true; // SSR: default collapsed to avoid flash
    // If user explicitly dismissed it, always stay collapsed
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return true;
    // Respect explicit toggle state
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    // First visit: show expanded
    return false;
  });

  const dimData = activeDim !== null ? STEPS[activeDim] : null;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
    // Once user collapses it, mark as permanently dismissed
    if (next) {
      localStorage.setItem(DISMISSED_KEY, 'true');
    }
  };

  return (
    <>
      <div className={collapsed ? 'px-2 mb-2' : 'px-2 mb-5'}>
        {/* Collapsible header */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center gap-2.5 py-2 mb-1"
        >
          <span className="text-white/80 text-sm font-bold tracking-wide">
            The 3D Journal
          </span>
          <svg
            className={`w-4 h-4 text-white/50 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Collapsible body — px-2 gives breathing room for circle glow/scale animation */}
        <div
          className={`transition-all duration-300 ${
            collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[160px] opacity-100'
          }`}
        >
          <div className="flex items-start px-2">
            {STEPS.map((step, i) => {
              const state = getStepState(step.id, activeStep);
              const isLast = i === STEPS.length - 1;

              return (
                <div key={step.id} className="contents">
                  {/* Step */}
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                    onClick={() => setActiveDim(i)}
                  >
                    {/* Circle badge */}
                    <div
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                      style={
                        state === 'active'
                          ? {
                              backgroundColor: 'var(--accent-color)',
                              borderColor: 'var(--accent-color)',
                              animation: `journalDimBreatheActive 8s ease-in-out ${BREATHE_DELAYS[i]} infinite`,
                            }
                          : state === 'past'
                          ? {
                              backgroundColor: 'color-mix(in srgb, var(--accent-color) 50%, transparent)',
                              borderColor: 'color-mix(in srgb, var(--accent-color) 70%, transparent)',
                            }
                          : {
                              backgroundColor: 'transparent',
                              borderColor: 'rgba(255,255,255,0.55)',
                              animation: `journalDimBreathe 8s ease-in-out ${BREATHE_DELAYS[i]} infinite`,
                            }
                      }
                    >
                      <span
                        className="font-bold text-sm leading-none"
                        style={{
                          color:
                            state === 'future'
                              ? 'rgba(255,255,255,0.6)'
                              : 'color-mix(in srgb, var(--primary-color) 85%, black 15%)',
                        }}
                      >
                        {step.badge}
                      </span>
                    </div>

                    {/* Label */}
                    <span
                      className="text-[11px] font-semibold tracking-wide transition-colors duration-300"
                      style={{
                        color:
                          state === 'active'
                            ? 'var(--accent-color)'
                            : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      {step.label}
                    </span>
                  </button>

                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className="flex-1 h-0.5 mt-5 mx-2 rounded-full transition-colors duration-300"
                      style={{
                        backgroundColor:
                          activeIdx > i
                            ? 'color-mix(in srgb, var(--accent-color) 70%, transparent)'
                            : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Hint text */}
          <p className="text-center text-white/55 text-xs mt-3 tracking-wide">
            tap to reveal their meaning
          </p>
        </div>
      </div>

      {/* Dimension info popup */}
      {dimData !== null && activeDim !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.65)', animation: 'journalFadeIn 0.2s ease' }}
          onClick={() => setActiveDim(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: `radial-gradient(ellipse at 110% 110%, color-mix(in srgb, var(--accent-color) 12%, transparent) 0%, transparent 60%), ${CARD_BG}`,
              borderTop: '1px solid color-mix(in srgb, var(--accent-color) 35%, transparent)',
              borderLeft: '1px solid color-mix(in srgb, var(--accent-color) 35%, transparent)',
              animation: 'journalPopIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[.08]">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2"
                  style={{
                    backgroundColor: 'var(--accent-color)',
                    borderColor: 'var(--accent-color)',
                    color: 'color-mix(in srgb, var(--primary-color) 85%, black 15%)',
                  }}
                >
                  {dimData.badge}
                </span>
                <div>
                  <h3 className="text-white font-semibold text-base">{dimData.label}</h3>
                  <p className="text-white/45 text-xs">{dimData.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDim(null)}
                className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-5 space-y-4">
              <p className="font-medium text-sm" style={{ color: 'var(--accent-color)' }}>
                {dimData.question}
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                {dimData.description}
              </p>
              <ul className="space-y-1.5">
                {dimData.prompts.map((prompt, pi) => (
                  <li key={pi} className="text-white/45 text-xs flex items-start gap-2">
                    <span style={{ color: 'var(--accent-color)' }}>•</span>
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t border-white/[.08] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDim(null)}
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-tl-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'color-mix(in srgb, var(--primary-color) 85%, black 15%)',
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
