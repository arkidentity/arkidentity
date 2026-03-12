import type { CourseRegistry, CourseRegistryEntry, CourseBranding } from '@/types/courses';

import registry from '@/data/courses/registry.json';

const courseRegistry = registry as unknown as CourseRegistry;

// ARK Identity brand colors — used for all course content
const ARK_BRAND = {
  navy: '#1a2b3c',
  gold: '#e8b562',
  maroon: '#5f0c0b',
  darkNavy: '#0d1520',
  teal: '#143348',
} as const;

export function getCourseList(): CourseRegistryEntry[] {
  return courseRegistry.courses
    .filter((c) => c.available)
    .sort((a, b) => a.order - b.order);
}

export function getCourseTheme(courseId: string): CourseBranding {
  const theme = courseRegistry.themes[courseId];
  if (theme) return theme;
  // Fallback: ARK Identity default colors
  return {
    primary: ARK_BRAND.navy,
    secondary: ARK_BRAND.teal,
    accent: ARK_BRAND.gold,
    dark: ARK_BRAND.darkNavy,
  };
}

export function getCourseRegistryEntry(courseId: string): CourseRegistryEntry | null {
  return courseRegistry.courses.find((c) => c.id === courseId) ?? null;
}

export function getCourseThemeVars(courseId: string): Record<string, string> {
  const theme = getCourseTheme(courseId);
  return {
    '--course-primary': theme.primary,
    '--course-secondary': theme.secondary,
    '--course-accent': theme.accent,
    '--course-dark': theme.dark,
  };
}

export { ARK_BRAND };
