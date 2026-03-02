'use client';

import { createContext, useContext, ReactNode } from 'react';

/**
 * Minimal ThemeProvider for ARK Identity.
 * ARK doesn't use church white-labeling, so this returns
 * static defaults. Components that reference useTheme()
 * (copied from Daily DNA) will work without changes.
 */
interface ThemeConfig {
  church_id: null;
  church_name: null;
  primary_color: string;
  accent_color: string;
  logo_url: null;
  icon_url: null;
  splash_logo_url: null;
  app_title: string;
  custom_tab_url: null;
  custom_tab_label: null;
  custom_tab_mode: null;
  [key: string]: unknown;
}

const defaultTheme: ThemeConfig = {
  church_id: null,
  church_name: null,
  primary_color: '#143348',
  accent_color: '#e8b562',
  logo_url: null,
  icon_url: null,
  splash_logo_url: null,
  app_title: 'ARK Identity',
  custom_tab_url: null,
  custom_tab_label: null,
  custom_tab_mode: null,
};

const ThemeContext = createContext<ThemeConfig>(defaultTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeConfig {
  return useContext(ThemeContext);
}
