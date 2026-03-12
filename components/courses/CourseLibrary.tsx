'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from '@/components/navigation/AppHeader';
import { getCourseList, getCourseTheme, getCourseRegistryEntry } from '@/lib/courses/courseRegistry';

const courses = getCourseList();

export function CourseLibrary() {
  return (
    <div className="course-library">
      <AppHeader />

      {/* Hero Card */}
      <div className="courses-hero">
        <div className="courses-hero-overlay" />
        <div className="courses-hero-content">
          <h1 className="courses-hero-title">
            Courses that build your<br />
            <span className="courses-hero-accent">identity in Christ</span>
          </h1>
          <div className="courses-hero-line" />
        </div>
      </div>

      <div className="course-grid">
        {courses.map((course) => {
          const theme = getCourseTheme(course.id);
          const entry = getCourseRegistryEntry(course.id);
          const cardGradient = theme.cardGradient || `linear-gradient(135deg, #1a2b3c, #0d1520)`;
          return (
            <Link key={course.id} href={`/courses/${course.id}`} className="course-card">
              {/* Background cover image */}
              {entry?.coverImage && (
                <img
                  className="card-bg-image"
                  src={entry.coverImage}
                  alt=""
                  aria-hidden="true"
                />
              )}
              {/* Gradient overlay */}
              <div
                className="card-overlay"
                style={{ background: cardGradient }}
              />
              {/* Content */}
              <div className="card-content">
                {/* Book cover on the left */}
                {entry?.bookCover && (
                  <div className="book-cover-wrap">
                    <img
                      className="book-cover"
                      src={entry.bookCover}
                      alt={`${course.title} cover`}
                    />
                  </div>
                )}
                <div className="card-info">
                  <h2>{course.title}</h2>
                  <p className="subtitle">{course.subtitle}</p>
                  {course.tagline && <p className="tagline">{course.tagline}</p>}
                  <div className="card-meta">
                    <span className="session-count">{course.sessions} sessions</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .course-library {
          min-height: 100vh;
          background: #1a2b3c;
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
        }

        /* ── Hero Card ── */
        .courses-hero {
          position: relative;
          margin: 0 16px 24px;
          border-radius: 20px;
          overflow: hidden;
          min-height: 180px;
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #0d1520 0%, #1a2b3c 40%, #243447 70%, #1a2b3c 100%);
          border: 1px solid rgba(232, 181, 98, 0.15);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(232, 181, 98, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .courses-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 80% 20%, rgba(232, 181, 98, 0.12), transparent),
            radial-gradient(ellipse 60% 80% at 10% 80%, rgba(232, 181, 98, 0.06), transparent);
          pointer-events: none;
        }
        .courses-hero-content {
          position: relative;
          z-index: 1;
          padding: 32px 28px;
          width: 100%;
        }
        .courses-hero-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: var(--ark-gold, #E8B562);
          text-transform: uppercase;
          margin: 0 0 12px 0;
          opacity: 0.85;
        }
        .courses-hero-title {
          font-size: 26px;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }
        .courses-hero-accent {
          color: var(--ark-gold, #E8B562);
          display: inline-block;
        }
        .courses-hero-line {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, var(--ark-gold, #E8B562), transparent);
          border-radius: 2px;
          margin-top: 20px;
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
          min-height: 200px;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .course-grid :global(.course-card):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(232, 181, 98, 0.2);
        }
        .course-grid :global(.course-card):active {
          transform: scale(0.99);
        }

        /* Background image layer */
        .card-bg-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }

        /* Gradient overlay on top of background image */
        .card-overlay {
          position: absolute;
          inset: 0;
          opacity: 0.88;
          z-index: 1;
        }

        /* Content layer */
        .card-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          min-height: 200px;
        }

        /* Book cover */
        .book-cover-wrap {
          flex-shrink: 0;
        }
        .book-cover {
          width: 120px;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.25);
          transform: rotate(-2deg);
          transition: transform 0.2s ease;
        }
        .course-grid :global(.course-card):hover .book-cover {
          transform: rotate(0deg) scale(1.03);
        }

        /* Info */
        .card-info {
          flex: 1;
          min-width: 0;
        }
        .card-info h2 {
          font-size: 22px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 6px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
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
          margin-top: 10px;
        }
        .session-count {
          display: inline-block;
          padding: 3px 10px;
          background: rgba(232, 181, 98, 0.9);
          color: #1a2b3c;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
