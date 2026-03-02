'use client';

import Link from 'next/link';
import { getCourseList, getCourseTheme } from '@/lib/courses/courseRegistry';

const courses = getCourseList();

export function CourseLibrary() {
  return (
    <div className="course-library">
      <div className="library-header">
        <h1>Courses</h1>
        <p>Discipleship courses for every stage of your journey</p>
      </div>

      <div className="course-grid">
        {courses.map((course) => {
          const theme = getCourseTheme(course.id);
          return (
            <Link key={course.id} href={`/courses/${course.id}`} className="course-card">
              <div
                className="card-bg"
                style={{
                  background: theme.gradient || `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.dark})`,
                }}
              />
              <div className="card-content">
                <h2>{course.title}</h2>
                <p className="subtitle">{course.subtitle}</p>
                {course.tagline && <p className="tagline">{course.tagline}</p>}
                <div className="card-meta">
                  <span className="session-count">{course.sessions} sessions</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .course-library {
          min-height: 100vh;
          background: var(--primary-color, #143348);
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
        }
        .library-header {
          padding: 48px 20px 24px;
        }
        .library-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 4px 0;
        }
        .library-header p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }
        .course-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 0 20px;
        }
        .course-grid :global(.course-card) {
          position: relative;
          display: block;
          border-radius: 16px;
          overflow: hidden;
          min-height: 160px;
          text-decoration: none;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .course-grid :global(.course-card):hover {
          transform: scale(1.02) translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        }
        .course-grid :global(.course-card):active {
          transform: scale(0.99);
        }
        .card-bg {
          position: absolute;
          inset: 0;
          opacity: 0.9;
          transition: opacity 0.3s ease;
        }
        .course-grid :global(.course-card):hover .card-bg {
          opacity: 1;
        }
        .card-content {
          position: relative;
          z-index: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 160px;
        }
        .card-content h2 {
          font-size: 24px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 4px 0;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 4px 0;
        }
        .tagline {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
          margin: 0 0 12px 0;
        }
        .card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        .session-count {
          display: inline-block;
          padding: 3px 10px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(4px);
          color: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
