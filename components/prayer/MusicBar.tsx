'use client';

import { useState } from 'react';
import { usePrayer } from './PrayerContext';
import { musicTracks } from '@/lib/prayerData';
import type { PrayerTheme } from '@/lib/prayerData';

interface MusicBarProps {
  showTimer?: boolean;
  showThemeSelector?: boolean;
}

export function MusicBar({ showTimer = false, showThemeSelector = true }: MusicBarProps) {
  const {
    state,
    toggleMusic,
    setVolume,
    selectTrack,
    setTheme,
  } = usePrayer();

  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const themes: PrayerTheme[] = ['fire', 'ocean', 'forest'];

  return (
    <>
      <div className="prayer-music-bar">
        {/* Volume Control */}
        <div className="music-volume-control">
          <button className="music-toggle-btn" onClick={toggleMusic}>
            {state.musicPlaying ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
          <input
            type="range"
            className="music-volume-slider"
            min="0"
            max="1"
            step="0.05"
            value={state.musicVolume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>

        {/* Track Selector */}
        <button className="music-track-btn" onClick={() => setShowTrackModal(true)}>
          <span className="music-track-name">{state.currentTrack.name}</span>
          <span className="music-track-arrow">▼</span>
        </button>

        {/* Timer (session only) */}
        {showTimer && (
          <div className="session-timer-display">
            {formatTime(state.timeRemaining)}
          </div>
        )}

        {/* Theme Selector */}
        {showThemeSelector && (
          <div className="theme-selector-wrapper">
            <button
              className={`theme-circle-btn ${state.theme}`}
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            />
            {showThemeDropdown && (
              <div className="theme-dropdown">
                {themes.map((theme) => (
                  <button
                    key={theme}
                    className={`theme-circle-btn ${theme} ${state.theme === theme ? 'active' : ''}`}
                    onClick={() => {
                      setTheme(theme);
                      setShowThemeDropdown(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Track Selection Modal */}
      {showTrackModal && (
        <div className="prayer-modal-overlay" onClick={() => setShowTrackModal(false)}>
          <div className="prayer-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select Music</h3>
            <div className="track-list">
              {musicTracks.map((track) => (
                <button
                  key={track.id}
                  className={`track-option ${state.currentTrack.id === track.id ? 'active' : ''}`}
                  onClick={() => {
                    selectTrack(track);
                    setShowTrackModal(false);
                  }}
                >
                  <span>{track.name}</span>
                  {state.currentTrack.id === track.id && state.musicPlaying && (
                    <span className="track-playing">♪</span>
                  )}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowTrackModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
