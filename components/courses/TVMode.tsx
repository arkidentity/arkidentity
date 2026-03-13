'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { COURSE_STORAGE_KEYS } from '@/types/courses';

interface TVModeContextValue {
  isActive: boolean;
  toggle: () => void;
}

const TVModeContext = createContext<TVModeContextValue>({ isActive: false, toggle: () => {} });

export function useTVMode() {
  return useContext(TVModeContext);
}

// ── Provider ──
export function TVModeProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  // Restore persisted state on mount
  useEffect(() => {
    const stored = localStorage.getItem(COURSE_STORAGE_KEYS.TV_MODE);
    if (stored === 'true') {
      setIsActive(true);
      document.body.classList.add('tv-mode');
    }
  }, []);

  const toggle = useCallback(() => {
    setIsActive((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('tv-mode');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.body.classList.remove('tv-mode');
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
      localStorage.setItem(COURSE_STORAGE_KEYS.TV_MODE, String(next));
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape' && isActive) {
        toggle();
        return;
      }

      if (isActive) {
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault();
          window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
          e.preventDefault();
          window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isActive, toggle]);

  // Clean up body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('tv-mode');
    };
  }, []);

  return (
    <TVModeContext.Provider value={{ isActive, toggle }}>
      {children}
      {isActive && <TVModeControls onExit={toggle} />}
    </TVModeContext.Provider>
  );
}

// ── Toggle Button ──
export function TVModeToggle() {
  const { isActive, toggle } = useTVMode();

  return (
    <>
      <button className="tv-mode-toggle" onClick={toggle} aria-label={isActive ? 'Exit TV Mode' : 'TV Mode'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
          <polyline points="17 2 12 7 7 2" />
        </svg>
        <span>{isActive ? 'Exit TV' : 'TV Mode'}</span>
      </button>

      <style jsx>{`
        .tv-mode-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .tv-mode-toggle:hover {
          background: rgba(232, 181, 98, 0.25);
          border-color: rgba(232, 181, 98, 0.4);
        }
        .tv-mode-toggle:active {
          transform: scale(0.96);
        }
      `}</style>
    </>
  );
}

// ── Floating Controls ──
function TVModeControls({ onExit }: { onExit: () => void }) {
  const scrollUp = () => window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
  const scrollDown = () => window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <>
      <div className="tv-controls">
        <button className="tv-ctrl-btn tv-exit-btn" onClick={onExit} title="Exit TV Mode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Exit
        </button>
        <div className="tv-ctrl-group">
          <button className="tv-ctrl-btn" onClick={scrollUp} title="Scroll Up (↑)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <button className="tv-ctrl-btn" onClick={scrollDown} title="Scroll Down (↓)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button className="tv-ctrl-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .tv-controls {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 28px;
          z-index: 9999;
          opacity: 0.3;
          transition: opacity 0.3s ease;
        }
        .tv-controls:hover {
          opacity: 1;
        }
        .tv-ctrl-group {
          display: flex;
          gap: 4px;
        }
        .tv-ctrl-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tv-ctrl-btn:hover {
          background: rgba(232, 181, 98, 0.5);
          border-color: rgba(232, 181, 98, 0.6);
        }
        .tv-exit-btn {
          width: auto;
          border-radius: 18px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}
