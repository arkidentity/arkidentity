'use client';

/**
 * JournalStepper - 1D → 2D → 3D progress indicator
 * Shows which dimension the user is currently working on.
 * Active step: filled accent circle.
 * Past step: dimmed accent circle (already visited).
 * Future step: outlined dim circle (not yet reached).
 * Connecting lines light up as steps are completed.
 */

import type { DimensionType } from '@/types/journal';

interface JournalStepperProps {
  activeStep: DimensionType;
}

const STEPS: { id: DimensionType; badge: string; label: string }[] = [
  { id: 'head',  badge: '1D', label: 'HEAD'  },
  { id: 'heart', badge: '2D', label: 'HEART' },
  { id: 'hands', badge: '3D', label: 'HANDS' },
];

const STEP_INDEX: Record<DimensionType, number> = { head: 0, heart: 1, hands: 2 };

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

  return (
    <div className="px-2 mb-5">
      {/* Circles + connecting lines */}
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const state = getStepState(step.id, activeStep);
          const isLast = i === STEPS.length - 1;

          return (
            <div key={step.id} className="contents">
              {/* Step */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                {/* Circle badge */}
                <div
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                  style={
                    state === 'active'
                      ? {
                          backgroundColor: 'var(--accent-color)',
                          borderColor: 'var(--accent-color)',
                        }
                      : state === 'past'
                      ? {
                          backgroundColor: 'color-mix(in srgb, var(--accent-color) 50%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--accent-color) 70%, transparent)',
                        }
                      : {
                          backgroundColor: 'transparent',
                          borderColor: 'rgba(255,255,255,0.55)',
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
                        : state === 'past'
                        ? 'rgba(255,255,255,0.55)'
                        : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line — not rendered after last step */}
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
    </div>
  );
}
