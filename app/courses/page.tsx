'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CourseInfo {
  id: string;
  title: string;
  subtitle: string;
  sessions: number;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => setCourses(data.courses || []))
      .catch(() => {});
  }, []);

  // Fallback static course list for when API isn't ready
  const fallbackCourses: CourseInfo[] = [
    { id: '100x', title: '100X', subtitle: 'Prepare \u2022 Protect \u2022 Produce', sessions: 3, theme: { primary: '#143348', secondary: '#1a4a6e', accent: '#e8b562' } },
    { id: 'identity-trinity', title: 'ID3', subtitle: 'Identity in the Trinity', sessions: 6, theme: { primary: '#5f0c0b', secondary: '#7a1a19', accent: '#e8b562' } },
    { id: 'the-way', title: 'The Way', subtitle: 'The Original Christian Creed', sessions: 6, theme: { primary: '#143348', secondary: '#1a4a6e', accent: '#e8b562' } },
    { id: 'hindered-hearing', title: 'Hindered Hearing', subtitle: 'Removing Barriers to God\u2019s Voice', sessions: 4, theme: { primary: '#2d1b4e', secondary: '#3d2760', accent: '#e8b562' } },
    { id: 'the-bridge', title: 'The Bridge', subtitle: 'Connecting Faith to Action', sessions: 5, theme: { primary: '#1a3a2a', secondary: '#2a5a3a', accent: '#e8b562' } },
  ];

  const displayCourses = courses.length > 0 ? courses : fallbackCourses;

  return (
    <div className="min-h-screen" style={{ background: 'var(--primary-color)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Courses</h1>
        <p className="text-white/60 text-sm">Discipleship courses for every stage of your journey</p>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {displayCourses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="block rounded-2xl p-5 transition-all hover:scale-[1.01]"
            style={{
              background: `linear-gradient(135deg, ${course.theme.primary}, ${course.theme.secondary})`,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h2 className="text-xl font-bold text-white mb-1">{course.title}</h2>
            <p className="text-white/70 text-sm mb-3">{course.subtitle}</p>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
              >
                {course.sessions} sessions
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
