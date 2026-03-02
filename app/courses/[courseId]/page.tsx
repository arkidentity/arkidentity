'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { getCourse } from '@/lib/courses/courseData';
import { getCourseThemeVars, getCourseRegistryEntry } from '@/lib/courses/courseRegistry';
import { CourseHero } from '@/components/courses/CourseHero';
import { SessionTOC } from '@/components/courses/SessionTOC';
import { VocabularyDrawer } from '@/components/courses/VocabularyDrawer';
import { PreSessionContent } from '@/components/courses/PreSessionContent';
import { COURSE_STORAGE_KEYS } from '@/types/courses';

function getCourseProgressFromStorage(courseId: string): {
  completedLessons: number;
  totalLessons: number;
  resumeSessionId: number | null;
  sessionProgress: Record<number, number[]>;
} {
  if (typeof window === 'undefined') {
    return { completedLessons: 0, totalLessons: 0, resumeSessionId: null, sessionProgress: {} };
  }
  try {
    const raw = localStorage.getItem(COURSE_STORAGE_KEYS.ALL_PROGRESS);
    if (!raw) return { completedLessons: 0, totalLessons: 0, resumeSessionId: null, sessionProgress: {} };
    const all = JSON.parse(raw) as Record<string, Record<string, number[]>>;
    const courseData = all[courseId];
    if (!courseData) return { completedLessons: 0, totalLessons: 0, resumeSessionId: null, sessionProgress: {} };

    let total = 0;
    let resumeSessionId: number | null = null;
    const sessionProgress: Record<number, number[]> = {};

    for (const [sessionIdStr, lessons] of Object.entries(courseData)) {
      const sId = parseInt(sessionIdStr, 10);
      sessionProgress[sId] = lessons;
      total += lessons.length;
    }

    // Find the last session that has progress (highest session ID with incomplete work or last session)
    const sessionIds = Object.keys(courseData).map(Number).sort((a, b) => a - b);
    if (sessionIds.length > 0) {
      resumeSessionId = sessionIds[sessionIds.length - 1];
    }

    return { completedLessons: total, totalLessons: 0, resumeSessionId, sessionProgress };
  } catch {
    return { completedLessons: 0, totalLessons: 0, resumeSessionId: null, sessionProgress: {} };
  }
}

export default function CourseLandingPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);

  const course = getCourse(courseId);
  const registryEntry = getCourseRegistryEntry(courseId);
  const themeVars = getCourseThemeVars(courseId);

  const [progress, setProgress] = useState<{
    completedLessons: number;
    resumeSessionId: number | null;
    sessionProgress: Record<number, number[]>;
  }>({ completedLessons: 0, resumeSessionId: null, sessionProgress: {} });

  useEffect(() => {
    const data = getCourseProgressFromStorage(courseId);
    setProgress({
      completedLessons: data.completedLessons,
      resumeSessionId: data.resumeSessionId,
      sessionProgress: data.sessionProgress,
    });
  }, [courseId]);

  if (!course) {
    return (
      <div style={{ minHeight: '100vh', background: '#1A2332', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <h1 style={{ color: '#D4A853', fontSize: 32, marginBottom: 16 }}>Course Not Found</h1>
        <p style={{ color: '#A0AEC0', marginBottom: 24 }}>This course doesn&apos;t exist.</p>
        <Link href="/courses" style={{ color: '#D4A853', textDecoration: 'underline' }}>Back to Courses</Link>
      </div>
    );
  }

  // Calculate total lessons from course data
  const totalLessons = course.sessions.reduce((sum, s) => sum + s.lessons.length, 0);

  // Build session TOC items from course data + session overviews
  const sessionItems = course.sessions.map((session) => {
    const overview = course.sessionOverviews?.find((o) => o.id === session.id);
    const completedIds = progress.sessionProgress[session.id] ?? [];
    return {
      id: session.id,
      title: session.title,
      synopsis: overview?.synopsis ?? session.synopsis,
      lessonCount: session.lessons.length,
      completedLessonCount: completedIds.length,
    };
  });

  return (
    <div className="course-landing" style={themeVars as React.CSSProperties}>
      {/* Back Navigation */}
      <div className="page-header">
        <div className="header-content">
          <Link href="/courses" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All Courses
          </Link>
        </div>
      </div>

      {/* Hero */}
      <CourseHero
        courseId={courseId}
        title={course.title}
        subtitle={course.subtitle}
        tagline={course.tagline}
        description={course.description}
        totalSessions={course.sessions.length}
        totalLessons={totalLessons}
        completedLessons={progress.completedLessons}
        resumeSessionId={progress.resumeSessionId}
      />

      {/* Main Content */}
      <main className="landing-main">
        <div className="landing-container">
          {/* Pre-session content (The Way's creed + essentials) */}
          {course.preSessionContent && (
            <PreSessionContent content={course.preSessionContent} />
          )}

          {/* Vocabulary Drawer */}
          {course.vocabulary && course.vocabulary.length > 0 && (
            <VocabularyDrawer terms={course.vocabulary} />
          )}

          {/* Session Table of Contents */}
          <SessionTOC courseId={courseId} sessions={sessionItems} />
        </div>
      </main>

      <style jsx>{`
        .course-landing {
          min-height: 100vh;
          background: #1A2332;
          color: #FFFFFF;
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
        }
        .page-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(26, 35, 50, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 16px 24px;
        }
        .header-content {
          max-width: 800px;
          margin: 0 auto;
        }
        .page-header :global(.back-link) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #A0AEC0;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }
        .page-header :global(.back-link):hover {
          color: var(--course-accent, #D4A853);
        }
        .landing-main {
          padding: 0 24px;
        }
        .landing-container {
          max-width: 800px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
