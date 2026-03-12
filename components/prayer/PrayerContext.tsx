'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { UserPrayerCard, PrayerTheme, PrayerSession, SessionCard, MusicTrack } from '@/lib/prayerData';
import { musicTracks, build4DSession } from '@/lib/prayerData';
import type { GuidedActivation } from '@/lib/guidedActivations';
import { buildActivationSession } from '@/lib/guidedActivations';
import {
  getPrayerCards,
  getActivePrayerCards,
  getAnsweredPrayerCards,
  createPrayerCard,
  updatePrayerCard,
  deletePrayerCard,
  markCardAsAnswered,
  incrementPrayerCount,
  getPrayerTheme,
  setPrayerTheme as saveTheme,
  getMusicVolume,
  setMusicVolume as saveVolume,
  isFirstTimePrayer,
  setFirstTimeComplete,
  getPrayerStreak,
  updatePrayerStreak,
} from '@/lib/prayerStorage';
import { syncPrayerCards } from '@/lib/prayerSync';
import { onPrayerSessionComplete } from '@/lib/activitySync';
import { useAuth } from '@/components/auth/AuthProvider';

// ============================================
// TYPES
// ============================================

export type PrayerView =
  | 'gate'
  | 'dashboard'
  | 'session'
  | 'my-cards'
  | 'completion'
  | 'activation-detail'
  | 'guided-activations';

interface PrayerState {
  // View state
  currentView: PrayerView;
  isFirstTime: boolean;

  // Theme & preferences
  theme: PrayerTheme;

  // Music state
  musicPlaying: boolean;
  musicVolume: number;
  currentTrack: MusicTrack;

  // Cards
  prayerCards: UserPrayerCard[];
  activeCards: UserPrayerCard[];
  answeredCards: UserPrayerCard[];

  // Session state
  session: PrayerSession | null;
  currentCardIndex: number;
  timeRemaining: number;
  isPaused: boolean;
  sessionDuration: number; // Selected duration in minutes

  // Streak
  streak: {
    current: number;
    longest: number;
    lastDate: string | null;
  };

  // UI state
  isLoading: boolean;
  showInfoModal: boolean;

  // Guided activations
  activeActivationId: string | null;
}

type PrayerAction =
  | { type: 'SET_VIEW'; view: PrayerView }
  | { type: 'SET_THEME'; theme: PrayerTheme }
  | { type: 'SET_MUSIC_PLAYING'; playing: boolean }
  | { type: 'SET_MUSIC_VOLUME'; volume: number }
  | { type: 'SET_CURRENT_TRACK'; track: MusicTrack }
  | { type: 'SET_CARDS'; cards: UserPrayerCard[] }
  | { type: 'SET_SESSION'; session: PrayerSession | null }
  | { type: 'SET_CURRENT_CARD_INDEX'; index: number }
  | { type: 'SET_TIME_REMAINING'; time: number }
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'SET_SESSION_DURATION'; duration: number }
  | { type: 'SET_STREAK'; streak: PrayerState['streak'] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_FIRST_TIME'; isFirst: boolean }
  | { type: 'SET_SHOW_INFO_MODAL'; show: boolean }
  | { type: 'SET_ACTIVE_ACTIVATION_ID'; id: string | null }
  | { type: 'REFRESH_CARDS' };

interface PrayerContextType {
  state: PrayerState;

  // Navigation
  navigateTo: (view: PrayerView) => void;
  exitPrayer: () => void;

  // Theme & preferences
  setTheme: (theme: PrayerTheme) => void;

  // Music controls
  playMusic: () => void;
  pauseMusic: () => void;
  toggleMusic: () => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  selectTrack: (track: MusicTrack) => void;

  // Card management
  addCard: (title: string, details?: string | null) => UserPrayerCard;
  editCard: (id: string, title: string, details?: string | null) => void;
  removeCard: (id: string) => void;
  markAsAnswered: (id: string, testimony?: string | null) => void;
  refreshCards: () => void;

  // Session controls
  startSession: () => void;
  startActivation: (activation: GuidedActivation) => void;
  selectActivation: (id: string) => void;
  endSession: (completed?: boolean) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  nextCard: () => void;
  prevCard: () => void;
  setSessionDuration: (minutes: number) => void;
  activeActivationId: string | null;

  // UI
  showInfo: () => void;
  hideInfo: () => void;

  // Sync
  syncCards: () => Promise<void>;
}

// ============================================
// INITIAL STATE
// ============================================

const getInitialState = (): PrayerState => {
  // localStorage reads are synchronous — no need for a loading state.
  // Read everything upfront to avoid a flash of the "Loading..." screen.
  if (typeof window === 'undefined') {
    // SSR: return bare defaults; client will hydrate immediately
    return {
      currentView: 'gate',
      isFirstTime: true,
      theme: 'fire',
      musicPlaying: false,
      musicVolume: 0.5,
      currentTrack: musicTracks[Math.floor(Math.random() * musicTracks.length)],
      prayerCards: [],
      activeCards: [],
      answeredCards: [],
      session: null,
      currentCardIndex: 0,
      timeRemaining: 0,
      isPaused: false,
      sessionDuration: 10,
      streak: { current: 0, longest: 0, lastDate: null },
      isLoading: false,
      showInfoModal: false,
      activeActivationId: null,
    };
  }

  const cards = getPrayerCards();
  return {
    currentView: 'gate',
    isFirstTime: isFirstTimePrayer(),
    theme: getPrayerTheme(),
    musicPlaying: false,
    musicVolume: getMusicVolume(),
    currentTrack: musicTracks[Math.floor(Math.random() * musicTracks.length)],
    prayerCards: cards,
    activeCards: cards.filter(c => c.status === 'active' && !c.deletedAt),
    answeredCards: cards.filter(c => c.status === 'answered' && !c.deletedAt),
    session: null,
    currentCardIndex: 0,
    timeRemaining: 0,
    isPaused: false,
    sessionDuration: 10,
    streak: getPrayerStreak(),
    isLoading: false,
    showInfoModal: false,
    activeActivationId: null,
  };
};

// ============================================
// REDUCER
// ============================================

function prayerReducer(state: PrayerState, action: PrayerAction): PrayerState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.view };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_MUSIC_PLAYING':
      return { ...state, musicPlaying: action.playing };
    case 'SET_MUSIC_VOLUME':
      return { ...state, musicVolume: action.volume };
    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrack: action.track };
    case 'SET_CARDS': {
      const cards = action.cards;
      return {
        ...state,
        prayerCards: cards,
        activeCards: cards.filter(c => c.status === 'active' && !c.deletedAt),
        answeredCards: cards.filter(c => c.status === 'answered' && !c.deletedAt),
      };
    }
    case 'REFRESH_CARDS': {
      const cards = getPrayerCards();
      return {
        ...state,
        prayerCards: cards,
        activeCards: cards.filter(c => c.status === 'active'),
        answeredCards: cards.filter(c => c.status === 'answered'),
      };
    }
    case 'SET_SESSION':
      return { ...state, session: action.session };
    case 'SET_CURRENT_CARD_INDEX':
      return { ...state, currentCardIndex: action.index };
    case 'SET_TIME_REMAINING':
      return { ...state, timeRemaining: action.time };
    case 'SET_PAUSED':
      return { ...state, isPaused: action.paused };
    case 'SET_SESSION_DURATION':
      return { ...state, sessionDuration: action.duration };
    case 'SET_STREAK':
      return { ...state, streak: action.streak };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_FIRST_TIME':
      return { ...state, isFirstTime: action.isFirst };
    case 'SET_SHOW_INFO_MODAL':
      return { ...state, showInfoModal: action.show };
    case 'SET_ACTIVE_ACTIVATION_ID':
      return { ...state, activeActivationId: action.id };
    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

const PrayerContext = createContext<PrayerContextType | null>(null);

export function usePrayer() {
  const context = useContext(PrayerContext);
  if (!context) {
    throw new Error('usePrayer must be used within a PrayerProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

interface PrayerProviderProps {
  children: React.ReactNode;
}

export function PrayerProvider({ children }: PrayerProviderProps) {
  const [state, dispatch] = useReducer(prayerReducer, getInitialState());
  const { user } = useAuth();

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingRef = useRef<number>(0);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    // Initialize audio element (must be in useEffect — no Audio on server)
    audioRef.current = new Audio();
    audioRef.current.loop = false;
    audioRef.current.volume = state.musicVolume;

    // Handle track ending - shuffle to next
    audioRef.current.addEventListener('ended', () => {
      const currentIndex = musicTracks.findIndex(t => t.id === state.currentTrack.id);
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * musicTracks.length);
      } while (nextIndex === currentIndex && musicTracks.length > 1);

      const nextTrack = musicTracks[nextIndex];
      dispatch({ type: 'SET_CURRENT_TRACK', track: nextTrack });
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && state.currentTrack) {
      const wasPlaying = state.musicPlaying;
      audioRef.current.src = state.currentTrack.file;
      if (wasPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [state.currentTrack]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.musicVolume;
    }
  }, [state.musicVolume]);

  // Sync cards when user logs in
  useEffect(() => {
    if (user) {
      syncPrayerCards(user).then(() => {
        dispatch({ type: 'REFRESH_CARDS' });
      });
    }
  }, [user]);

  // ============================================
  // NAVIGATION
  // ============================================

  const navigateTo = useCallback((view: PrayerView) => {
    dispatch({ type: 'SET_VIEW', view });

    // Mark first time complete when entering dashboard
    if (view === 'dashboard' && state.isFirstTime) {
      setFirstTimeComplete();
      dispatch({ type: 'SET_FIRST_TIME', isFirst: false });
    }
  }, [state.isFirstTime]);

  const exitPrayer = useCallback(() => {
    // Music keeps playing — user controls it via the header music button

    // Clear session
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    dispatch({ type: 'SET_SESSION', session: null });

    // Navigate back
    window.history.back();
  }, []);

  // ============================================
  // THEME & PREFERENCES
  // ============================================

  const setTheme = useCallback((theme: PrayerTheme) => {
    saveTheme(theme);
    dispatch({ type: 'SET_THEME', theme });
  }, []);

  // ============================================
  // MUSIC CONTROLS
  // ============================================

  const playMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
      dispatch({ type: 'SET_MUSIC_PLAYING', playing: true });
    }
  }, []);

  const pauseMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      dispatch({ type: 'SET_MUSIC_PLAYING', playing: false });
    }
  }, []);

  const toggleMusic = useCallback(() => {
    if (state.musicPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }, [state.musicPlaying, playMusic, pauseMusic]);

  const setVolume = useCallback((volume: number) => {
    saveVolume(volume);
    dispatch({ type: 'SET_MUSIC_VOLUME', volume });
  }, []);

  const nextTrack = useCallback(() => {
    const currentIndex = musicTracks.findIndex(t => t.id === state.currentTrack.id);
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * musicTracks.length);
    } while (nextIndex === currentIndex && musicTracks.length > 1);

    dispatch({ type: 'SET_CURRENT_TRACK', track: musicTracks[nextIndex] });
  }, [state.currentTrack]);

  const selectTrack = useCallback((track: MusicTrack) => {
    dispatch({ type: 'SET_CURRENT_TRACK', track });
  }, []);

  // ============================================
  // CARD MANAGEMENT
  // ============================================

  const addCard = useCallback((title: string, details: string | null = null): UserPrayerCard => {
    const card = createPrayerCard(title, details);
    dispatch({ type: 'REFRESH_CARDS' });
    return card;
  }, []);

  const editCard = useCallback((id: string, title: string, details: string | null = null) => {
    updatePrayerCard(id, { title, details });
    dispatch({ type: 'REFRESH_CARDS' });
  }, []);

  const removeCard = useCallback((id: string) => {
    deletePrayerCard(id);
    dispatch({ type: 'REFRESH_CARDS' });
  }, []);

  const markAsAnswered = useCallback((id: string, testimony: string | null = null) => {
    markCardAsAnswered(id, testimony);
    dispatch({ type: 'REFRESH_CARDS' });
  }, []);

  const refreshCards = useCallback(() => {
    dispatch({ type: 'REFRESH_CARDS' });
  }, []);

  // ============================================
  // SESSION CONTROLS
  // ============================================

  const startSession = useCallback(() => {
    const activeCards = getActivePrayerCards();
    const session = build4DSession(state.sessionDuration, activeCards);

    // Set the ref to the total duration so the interval uses the correct value
    timeRemainingRef.current = session.totalDuration;

    dispatch({ type: 'SET_SESSION', session });
    dispatch({ type: 'SET_CURRENT_CARD_INDEX', index: 0 });
    dispatch({ type: 'SET_TIME_REMAINING', time: session.totalDuration });
    dispatch({ type: 'SET_PAUSED', paused: false });
    dispatch({ type: 'SET_VIEW', view: 'session' });

    // Start music
    playMusic();

    // Start timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      timeRemainingRef.current -= 1;
      dispatch({ type: 'SET_TIME_REMAINING', time: timeRemainingRef.current });
    }, 1000);
  }, [state.sessionDuration, playMusic]);

  const startActivation = useCallback((activation: GuidedActivation) => {
    const session = buildActivationSession(activation);

    timeRemainingRef.current = session.totalDuration;

    dispatch({ type: 'SET_SESSION', session });
    dispatch({ type: 'SET_CURRENT_CARD_INDEX', index: 0 });
    dispatch({ type: 'SET_TIME_REMAINING', time: session.totalDuration });
    dispatch({ type: 'SET_PAUSED', paused: false });
    dispatch({ type: 'SET_ACTIVE_ACTIVATION_ID', id: activation.id });
    dispatch({ type: 'SET_VIEW', view: 'session' });

    playMusic();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      timeRemainingRef.current -= 1;
      dispatch({ type: 'SET_TIME_REMAINING', time: timeRemainingRef.current });
    }, 1000);
  }, [playMusic]);

  const selectActivation = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_ACTIVATION_ID', id });
    dispatch({ type: 'SET_VIEW', view: 'activation-detail' });
  }, []);

  const endSession = useCallback((completed: boolean = true) => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (completed) {
      // Update streak
      const newStreak = updatePrayerStreak();
      dispatch({ type: 'SET_STREAK', streak: newStreak });

      // Increment prayer count for user cards that were prayed for
      const userCardCount = state.session
        ? state.session.cards.filter(c => c.isUserCard && c.cardId).length
        : 0;

      if (state.session) {
        state.session.cards
          .filter(c => c.isUserCard && c.cardId)
          .forEach(c => incrementPrayerCount(c.cardId!));
      }

      // Sync personal sessions to Supabase (skip activations — no card metrics apply)
      if (user?.id && state.session && state.session.type !== 'activation') {
        const sessionCards = state.session.cards;
        const hasType = (t: string) => sessionCards.some(c => c.type === t);

        onPrayerSessionComplete(user.id, {
          durationMinutes: state.sessionDuration,
          cardsPrayed: userCardCount,
          completedRevere: hasType('REVERE'),
          completedReflect: hasType('REFLECT'),
          completedRequest: hasType('REQUEST'),
          completedRest: hasType('REST'),
        }).catch(err => console.warn('[Prayer] Session sync error:', err));
      }

      dispatch({ type: 'SET_VIEW', view: 'completion' });
    } else {
      dispatch({ type: 'SET_VIEW', view: 'dashboard' });
    }

    dispatch({ type: 'SET_SESSION', session: null });
    dispatch({ type: 'SET_ACTIVE_ACTIVATION_ID', id: null });
  }, [state.session, state.sessionDuration, user]);

  const pauseSession = useCallback(() => {
    dispatch({ type: 'SET_PAUSED', paused: true });
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Music continues playing — only the timer pauses
  }, []);

  const resumeSession = useCallback(() => {
    dispatch({ type: 'SET_PAUSED', paused: false });

    timerRef.current = setInterval(() => {
      timeRemainingRef.current -= 1;
      dispatch({ type: 'SET_TIME_REMAINING', time: timeRemainingRef.current });
    }, 1000);
    // Music is already playing — no need to restart
  }, []);

  const nextCard = useCallback(() => {
    if (!state.session) return;

    const nextIndex = state.currentCardIndex + 1;
    if (nextIndex >= state.session.cards.length) {
      endSession(true);
    } else {
      dispatch({ type: 'SET_CURRENT_CARD_INDEX', index: nextIndex });
    }
  }, [state.session, state.currentCardIndex, endSession]);

  const prevCard = useCallback(() => {
    if (state.currentCardIndex > 0) {
      dispatch({ type: 'SET_CURRENT_CARD_INDEX', index: state.currentCardIndex - 1 });
    }
  }, [state.currentCardIndex]);

  const setSessionDuration = useCallback((minutes: number) => {
    dispatch({ type: 'SET_SESSION_DURATION', duration: minutes });
  }, []);

  // ============================================
  // UI
  // ============================================

  const showInfo = useCallback(() => {
    dispatch({ type: 'SET_SHOW_INFO_MODAL', show: true });
  }, []);

  const hideInfo = useCallback(() => {
    dispatch({ type: 'SET_SHOW_INFO_MODAL', show: false });
  }, []);

  // ============================================
  // SYNC
  // ============================================

  const syncCards = useCallback(async () => {
    if (user) {
      await syncPrayerCards(user);
      dispatch({ type: 'REFRESH_CARDS' });
    }
  }, [user]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: PrayerContextType = {
    state,
    navigateTo,
    exitPrayer,
    setTheme,
    playMusic,
    pauseMusic,
    toggleMusic,
    setVolume,
    nextTrack,
    selectTrack,
    addCard,
    editCard,
    removeCard,
    markAsAnswered,
    refreshCards,
    startSession,
    startActivation,
    selectActivation,
    endSession,
    pauseSession,
    resumeSession,
    nextCard,
    prevCard,
    setSessionDuration,
    activeActivationId: state.activeActivationId,
    showInfo,
    hideInfo,
    syncCards,
  };

  return (
    <PrayerContext.Provider value={value}>
      {children}
    </PrayerContext.Provider>
  );
}
