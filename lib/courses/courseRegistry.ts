import type { CourseRegistry, CourseRegistryEntry, CourseBranding } from '@/types/courses';

import registry from '@/data/courses/registry.json';

const courseRegistry = registry as unknown as CourseRegistry;

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
    primary: '#143348',
    secondary: '#1a4a6e',
    accent: '#e8b562',
    dark: '#0d1b2a',
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
