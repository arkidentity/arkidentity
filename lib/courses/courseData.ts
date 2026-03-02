import type { Course, Session, Lesson } from '@/types/courses';

import course100x from '@/data/courses/100x.json';
import courseIdentityTrinity from '@/data/courses/identity-trinity.json';
import courseHinderedHearing from '@/data/courses/hindered-hearing.json';
import courseTheWay from '@/data/courses/the-way.json';
import courseTheBridge from '@/data/courses/the-bridge.json';

const courses: Record<string, Course> = {
  '100x': course100x as unknown as Course,
  'identity-trinity': courseIdentityTrinity as unknown as Course,
  'hindered-hearing': courseHinderedHearing as unknown as Course,
  'the-way': courseTheWay as unknown as Course,
  'the-bridge': courseTheBridge as unknown as Course,
};

export function getCourse(courseId: string): Course | null {
  return courses[courseId] ?? null;
}

export function getSession(courseId: string, sessionId: number): Session | null {
  const course = getCourse(courseId);
  if (!course) return null;
  return course.sessions.find((s) => s.id === sessionId) ?? null;
}

export function getLesson(courseId: string, sessionId: number, lessonId: number): Lesson | null {
  const session = getSession(courseId, sessionId);
  if (!session) return null;
  return session.lessons.find((l) => l.id === lessonId) ?? null;
}

export function getAllCourseIds(): string[] {
  return Object.keys(courses);
}

export function getTotalLessons(courseId: string): number {
  const course = getCourse(courseId);
  if (!course) return 0;
  return course.sessions.reduce((sum, s) => sum + s.lessons.length, 0);
}

export function getSessionCount(courseId: string): number {
  const course = getCourse(courseId);
  if (!course) return 0;
  return course.sessions.length;
}
