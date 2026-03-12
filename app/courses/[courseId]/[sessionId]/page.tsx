'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { getCourse, getSessionCount } from '@/lib/courses/courseData';
import { getCourseThemeVars } from '@/lib/courses/courseRegistry';
import { SessionHeroCard } from '@/components/courses/SessionHeroCard';
import { WarmUpBlock } from '@/components/courses/WarmUpBlock';
import { LessonCard } from '@/components/courses/LessonCard';
import { SupportingScriptures } from '@/components/courses/SupportingScriptures';
import { COURSE_STORAGE_KEYS } from '@/types/courses';

function getStoredProgress(courseId: string): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COURSE_STORAGE_KEYS.ALL_PROGRESS);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, Record<string, number[]>>;
    // Flatten all session lessons into one array for this course
    const courseData = all[courseId];
    if (!courseData) return [];
    const completed: number[] = [];
    for (const lessons of Object.values(courseData)) {
      completed.push(...lessons);
    }
    return completed;
  } catch { return []; }
}

function getSessionCompletedLessons(courseId: string, sessionId: number): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COURSE_STORAGE_KEYS.ALL_PROGRESS);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, Record<string, number[]>>;
    return all[courseId]?.[String(sessionId)] ?? [];
  } catch { return []; }
}

function markLessonCompleteInStorage(courseId: string, sessionId: number, lessonId: number): number[] {
  try {
    const raw = localStorage.getItem(COURSE_STORAGE_KEYS.ALL_PROGRESS);
    const all = raw ? JSON.parse(raw) as Record<string, Record<string, number[]>> : {};
    if (!all[courseId]) all[courseId] = {};
    if (!all[courseId][String(sessionId)]) all[courseId][String(sessionId)] = [];
    const lessons = all[courseId][String(sessionId)];
    if (!lessons.includes(lessonId)) {
      lessons.push(lessonId);
    }
    localStorage.setItem(COURSE_STORAGE_KEYS.ALL_PROGRESS, JSON.stringify(all));
    return lessons;
  } catch { return []; }
}

export default function SessionPage({ params }: { params: Promise<{ courseId: string; sessionId: string }> }) {
  const { courseId, sessionId: sessionIdStr } = use(params);
  const sessionId = parseInt(sessionIdStr, 10);

  const course = getCourse(courseId);
  const session = course?.sessions.find((s) => s.id === sessionId) ?? null;
  const totalSessions = course ? getSessionCount(courseId) : 0;
  const themeVars = getCourseThemeVars(courseId);

  const [completedLessons, setCompletedLessons] = useState<number[]>(() =>
    getSessionCompletedLessons(courseId, sessionId)
  );
  const [expandedLessons, setExpandedLessons] = useState<number[]>(() => {
    // Expand first incomplete lesson, or first lesson if none completed
    if (!session) return [];
    const firstIncomplete = session.lessons.find((l) => !getSessionCompletedLessons(courseId, sessionId).includes(l.id));
    return [firstIncomplete?.id ?? session.lessons[0]?.id ?? 1];
  });
  const [isSaving, setIsSaving] = useState(false);

  const toggleLesson = useCallback((lessonId: number) => {
    setExpandedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  }, []);

  const handleMarkComplete = useCallback((lessonId: number) => {
    setIsSaving(true);
    const updated = markLessonCompleteInStorage(courseId, sessionId, lessonId);
    setCompletedLessons([...updated]);

    // Auto-expand next lesson
    if (session) {
      const nextLesson = session.lessons.find((l) => l.id > lessonId && !updated.includes(l.id));
      if (nextLesson) {
        setExpandedLessons([nextLesson.id]);
      }
    }

    setIsSaving(false);
  }, [courseId, sessionId, session]);

  if (!course || !session) {
    return (
      <div style={{ minHeight: '100vh', background: '#1A2332', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <h1 style={{ color: '#e8b562', fontSize: 32, marginBottom: 16 }}>Not Found</h1>
        <p style={{ color: '#A0AEC0', marginBottom: 24 }}>This session doesn&apos;t exist.</p>
        <Link href="/courses" style={{ color: '#e8b562', textDecoration: 'underline' }}>Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="session-page" style={themeVars as React.CSSProperties}>
      {/* Back Navigation */}
      <div className="page-header">
        <div className="header-content">
          <Link href={`/courses/${courseId}`} className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {course.title}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="session-main">
        <div className="session-container">
          {/* Session Hero */}
          <SessionHeroCard
            sessionNumber={session.id}
            totalSessions={totalSessions}
            title={session.title}
            verse={session.verse}
            verseRef={session.verseRef}
            completedLessons={completedLessons.length}
            totalLessons={session.lessons.length}
          />

          {/* Warm Up */}
          <WarmUpBlock questions={session.warmUp} />

          {/* Lessons */}
          <div className="lessons-section">
            <h2 className="lessons-heading">Lessons</h2>
            <div className="lessons-list">
              {session.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isCompleted={completedLessons.includes(lesson.id)}
                  isExpanded={expandedLessons.includes(lesson.id)}
                  onToggle={() => toggleLesson(lesson.id)}
                  onMarkComplete={() => handleMarkComplete(lesson.id)}
                  isSaving={isSaving}
                />
              ))}
            </div>
          </div>

          {/* Supporting Scriptures */}
          {session.supportingScriptures && (
            <SupportingScriptures scriptures={session.supportingScriptures} />
          )}

          {/* Session Navigation */}
          <div className="session-navigation">
            {sessionId > 1 && (
              <Link href={`/courses/${courseId}/${sessionId - 1}`} className="nav-link prev">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Previous Session
              </Link>
            )}
            {sessionId < totalSessions && (
              <Link href={`/courses/${courseId}/${sessionId + 1}`} className="nav-link next">
                Next Session
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .session-page {
          min-height: 100vh;
          background: #1a2b3c;
          color: #FFFFFF;
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
        }
        .page-header {
          background: #143348;
          border-bottom: 1px solid rgba(232, 181, 98, 0.1);
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
          color: #e8b562;
        }
        .session-main {
          padding: 24px;
        }
        .session-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .lessons-heading {
          font-size: 18px;
          color: #A0AEC0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 16px 0;
        }
        .lessons-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .session-navigation {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid rgba(232, 181, 98, 0.1);
        }
        .session-navigation :global(.nav-link) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #A0AEC0;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .session-navigation :global(.nav-link):hover {
          color: #e8b562;
        }
        .session-navigation :global(.nav-link.next) {
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}
