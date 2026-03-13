'use client';

import Link from 'next/link';
import { VideoEmbed } from './VideoEmbed';
import { getCourseRegistryEntry } from '@/lib/courses/courseRegistry';

interface CourseHeroProps {
  courseId: string;
  title: string;
  subtitle: string;
  tagline?: string;
  description: string;
  totalSessions: number;
  totalLessons: number;
  completedLessons: number;
  resumeSessionId: number | null;
  introVideoId?: string;
}

export function CourseHero({
  courseId,
  title,
  subtitle,
  tagline,
  description,
  totalSessions,
  totalLessons,
  completedLessons,
  resumeSessionId,
  introVideoId,
}: CourseHeroProps) {
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const hasStarted = completedLessons > 0;
  const isComplete = completedLessons >= totalLessons && totalLessons > 0;
  const entry = getCourseRegistryEntry(courseId);

  return (
    <div className="course-hero">
      {/* Background cover image */}
      {entry?.coverImage && (
        <img
          className="hero-bg-image"
          src={entry.coverImage}
          alt=""
          aria-hidden="true"
        />
      )}
      <div className="hero-gradient" />
      <div className="hero-content">
        <div className="hero-meta">
          <span className="meta-badge">{totalSessions} Sessions</span>
          {hasStarted && (
            <span className={`meta-badge ${isComplete ? 'complete' : 'in-progress'}`}>
              {isComplete ? 'Completed' : `${progressPercent}% Complete`}
            </span>
          )}
        </div>

        <h1 className="hero-title">{title}</h1>
        <p className="hero-subtitle">{subtitle}</p>
        {tagline && <p className="hero-tagline">{tagline}</p>}
        <p className="hero-description">{description}</p>

        {/* Progress bar */}
        {hasStarted && (
          <div className="hero-progress">
            <div className="progress-track">
              <div
                className={`progress-fill ${isComplete ? 'complete' : ''}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="progress-text">{completedLessons}/{totalLessons} lessons</span>
          </div>
        )}

        {/* CTA */}
        <div className="hero-cta">
          {hasStarted && resumeSessionId ? (
            <Link href={`/courses/${courseId}/${resumeSessionId}`} className="cta-button">
              {isComplete ? 'Review Course' : 'Resume Where You Left Off'}
            </Link>
          ) : (
            <Link href={`/courses/${courseId}/1`} className="cta-button">
              Start Course
            </Link>
          )}
        </div>

        {/* Intro video */}
        {introVideoId && (
          <div className="hero-video">
            <VideoEmbed videoId={introVideoId} title={`${title} Introduction`} />
          </div>
        )}
      </div>

      <style jsx>{`
        .course-hero {
          position: relative;
          overflow: hidden;
          border-radius: 0 0 24px 24px;
          margin-bottom: 32px;
        }
        .hero-bg-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }
        .hero-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(26, 43, 60, 0.92) 0%,
            rgba(20, 51, 72, 0.95) 50%,
            rgba(13, 21, 32, 0.98) 100%
          );
          z-index: 1;
        }
        .hero-content {
          position: relative;
          z-index: 2;
          padding: 48px 24px 32px;
          max-width: 800px;
          margin: 0 auto;
        }
        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .meta-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.7);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .meta-badge.in-progress {
          color: #e8b562;
          background: rgba(232, 181, 98, 0.15);
        }
        .meta-badge.complete {
          color: #2E7D5E;
          background: rgba(46, 125, 94, 0.15);
        }
        .hero-title {
          font-size: 32px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 8px 0;
          line-height: 1.15;
        }
        .hero-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.75);
          margin: 0 0 4px 0;
          font-weight: 500;
        }
        .hero-tagline {
          font-size: 14px;
          color: #e8b562;
          font-style: italic;
          margin: 0 0 16px 0;
        }
        .hero-description {
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.65);
          margin: 0 0 24px 0;
        }
        .hero-progress {
          margin-bottom: 24px;
        }
        .progress-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-fill {
          height: 100%;
          background: #e8b562;
          border-radius: 3px;
          transition: width 0.4s ease;
        }
        .progress-fill.complete {
          background: #2E7D5E;
        }
        .progress-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .hero-cta {
          margin-bottom: 24px;
        }
        .hero-cta :global(.cta-button) {
          display: inline-block;
          padding: 12px 28px;
          background: #e8b562;
          color: #1a2b3c;
          font-size: 15px;
          font-weight: 600;
          border-radius: 12px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hero-cta :global(.cta-button):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(232, 181, 98, 0.35);
        }
        .hero-cta :global(.cta-button):active {
          transform: scale(0.98);
        }
        .hero-video {
          margin-top: 8px;
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
