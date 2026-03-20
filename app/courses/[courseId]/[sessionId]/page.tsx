'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { getCourse, getSessionCount } from '@courses/lib/courses/courseData';
import { getCourseThemeVars } from '@courses/lib/courses/courseRegistry';
import { SessionHeroCard } from '@courses/components/courses/SessionHeroCard';
import { WarmUpBlock } from '@courses/components/courses/WarmUpBlock';
import { LessonCard } from '@courses/components/courses/LessonCard';
import { SupportingScriptures } from '@courses/components/courses/SupportingScriptures';
import { COURSE_STORAGE_KEYS } from '@courses/types/courses';
import { TVModeProvider, TVModeToggle } from '@courses/components/courses/TVMode';

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
        <Link href="/" style={{ color: '#e8b562', textDecoration: 'underline' }}>Back to Courses</Link>
      </div>
    );
  }

  return (
    <TVModeProvider>
    <div className="session-page" style={themeVars as React.CSSProperties}>
      <div className="page-header">
        <div className="header-content">
          <Link href={`/courses/${courseId}`} className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {course.title}
          </Link>
          <TVModeToggle />
        </div>
      </div>

      <main className="session-main">
        <div className="session-container">
          <SessionHeroCard
            sessionNumber={session.id}
            totalSessions={totalSessions}
            title={session.title}
            verse={session.verse}
            verseRef={session.verseRef}
            completedLessons={completedLessons.length}
            totalLessons={session.lessons.length}
          />

          <WarmUpBlock questions={session.warmUp} />

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

          {session.supportingScriptures && (
            <SupportingScriptures scriptures={session.supportingScriptures} />
          )}

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
          display: flex;
          align-items: center;
          justify-content: space-between;
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
    </TVModeProvider>
  );
}
