'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AMAZON_BOOKS_URL = 'https://www.amazon.com/dp/B09MGCW4V4';

interface ArkOnlineEvent {
  id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  time: string | null;
  event_time: string | null;
  timezone: string | null;
  meeting_link: string | null;
  meeting_type: string | null;
  event_type: string;
  specific_date: string | null;
  is_active: boolean;
}

function formatEventTime(event: ArkOnlineEvent): string {
  if (!event.event_time) return event.time || 'TBD';

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const eventTz = event.timezone || 'America/Chicago';

  // Build a reference date
  let refDate: string;
  if (event.specific_date) {
    refDate = event.specific_date;
  } else if (event.day_of_week != null) {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = event.day_of_week - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const next = new Date(today);
    next.setDate(next.getDate() + daysUntil);
    refDate = next.toISOString().split('T')[0];
  } else {
    refDate = new Date().toISOString().split('T')[0];
  }

  const [hours, minutes] = event.event_time.split(':');
  const eventDate = new Date(`${refDate}T${hours}:${minutes}:00`);

  // Get timezone abbreviations
  const getAbbr = (tz: string) => {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' });
    return fmt.format(eventDate).split(' ').pop() || '';
  };

  const eventAbbr = getAbbr(eventTz);
  const userAbbr = getAbbr(userTz);

  // Format the event time in 12h
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  const timeStr = `${h12}:${minutes} ${ampm}`;

  if (eventAbbr === userAbbr) {
    return `${timeStr} ${eventAbbr}`;
  }

  // Convert to user timezone
  const noonUtc = new Date(`${refDate}T12:00:00Z`);
  const partsInEventTz = new Intl.DateTimeFormat('en-US', {
    timeZone: eventTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(noonUtc);
  const eventHourAtNoon = parseInt(partsInEventTz.find(p => p.type === 'hour')?.value || '12');
  const offset = eventHourAtNoon - 12;

  let utcHour = parseInt(hours) - offset;
  let dayAdj = 0;
  if (utcHour >= 24) { utcHour -= 24; dayAdj = 1; }
  else if (utcHour < 0) { utcHour += 24; dayAdj = -1; }

  const utcDate = new Date(`${refDate}T${String(utcHour).padStart(2, '0')}:${minutes}:00Z`);
  if (dayAdj !== 0) utcDate.setUTCDate(utcDate.getUTCDate() + dayAdj);

  const userTimeStr = utcDate.toLocaleString('en-US', {
    timeZone: userTz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${userTimeStr} ${userAbbr} (${timeStr} ${eventAbbr})`;
}

function shareEvent(title: string, meetingLink: string | null) {
  const text = `Join me for ${title}!${meetingLink ? `\n\nMeeting Link: ${meetingLink}` : ''}`;
  if (navigator.share && meetingLink) {
    navigator.share({ title, text }).catch(() => {
      navigator.clipboard.writeText(text);
    });
  } else {
    navigator.clipboard.writeText(text);
  }
}

export default function ResourcesPage() {
  const [events, setEvents] = useState<ArkOnlineEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('specific_date', { ascending: true });
      if (data) setEvents(data as ArkOnlineEvent[]);
    } catch {
      // silent
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const recurringEvents = events.filter(e => e.event_type === 'recurring');
  const oneTimeEvents = events.filter(e => e.event_type === 'one_time')
    .sort((a, b) => new Date(a.specific_date || '').getTime() - new Date(b.specific_date || '').getTime());

  return (
    <div className="min-h-screen" style={{ background: 'var(--primary-color)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/" className="app-header-logo">
            <Image
              src="/images/ark-logo-web.png"
              alt="ARK Identity"
              width={160}
              height={32}
              priority
              className="app-header-logo-img"
            />
          </Link>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-6">
        {/* ── ARK Online Section ── */}
        <section>
          <div className="resources-section-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,181,98,0.15)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--ark-gold)" strokeWidth="1.5" className="w-5 h-5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="15" height="14" rx="2" ry="2" />
                  <polygon points="23 7 16 12 23 17 23 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ARK Online</h2>
                <p className="text-white/50 text-sm">Weekly Bible studies & prayer calls</p>
              </div>
            </div>

            {eventsLoading ? (
              <div className="text-center py-4 text-white/40 text-sm">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-4 text-white/40 text-sm">No events scheduled at this time</div>
            ) : (
              <>
                {/* Weekly Schedule */}
                {recurringEvents.length > 0 && (
                  <div className="mb-4">
                    <div className="space-y-3">
                      {recurringEvents.map(event => (
                        <div key={event.id} className="resources-event-card resources-event-row">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm">{event.title}</h4>
                            <p className="text-white/50 text-xs mt-0.5">
                              Every {DAYS[event.day_of_week]} at {formatEventTime(event)}
                            </p>
                            {event.description && (
                              <p className="text-white/40 text-xs mt-1">{event.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {event.meeting_link && (
                              <a
                                href={event.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="resources-btn-primary"
                              >
                                Join
                              </a>
                            )}
                            <button
                              className="resources-btn-outline"
                              onClick={() => shareEvent(event.title, event.meeting_link)}
                            >
                              Share
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Events */}
                {oneTimeEvents.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Upcoming Events</h3>
                    <div className="space-y-3">
                      {oneTimeEvents.map(event => (
                        <div key={event.id} className="resources-event-card resources-event-row">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm">{event.title}</h4>
                            <p className="text-white/50 text-xs mt-0.5">
                              {event.specific_date && new Date(event.specific_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              {' at '}{formatEventTime(event)}
                            </p>
                            {event.description && (
                              <p className="text-white/40 text-xs mt-1">{event.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {event.meeting_link && (
                              <a
                                href={event.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="resources-btn-primary"
                              >
                                Join
                              </a>
                            )}
                            <button
                              className="resources-btn-outline"
                              onClick={() => shareEvent(event.title, event.meeting_link)}
                            >
                              Share
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── ARK Books ── */}
        <section>
          <div className="resources-section-card resources-books-card">
            <div className="resources-books-image">
              <Image
                src="/images/ark books.jpg"
                alt="ARK Identity Books"
                width={140}
                height={180}
                className="rounded-lg object-cover w-full h-full"
              />
            </div>
            <div className="resources-books-content">
              <h2 className="text-lg font-bold mb-1">ARK Books</h2>
              <p className="text-sm mb-4">Identity-focused discipleship resources</p>
              <a
                href={AMAZON_BOOKS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="resources-btn-gold-sm"
              >
                Amazon
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── Creed Cards ── */}
        <section>
          <Link href="/creed-cards" className="resources-section-card block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,181,98,0.15)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--ark-gold)" strokeWidth="1.5" className="w-5 h-5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Creed Cards</h2>
                  <p className="text-white/50 text-sm">50 core truths of the Christian faith</p>
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5 opacity-40" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        </section>

        {/* ── We Believe PDF ── */}
        <section>
          <div className="resources-section-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,181,98,0.15)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--ark-gold)" strokeWidth="1.5" className="w-5 h-5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">We Believe</h2>
                <p className="text-white/50 text-sm">Our statement of faith</p>
              </div>
            </div>
            <a
              href="/We Believe.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="resources-btn-outline w-full block text-center"
            >
              Download PDF
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 inline-block ml-2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
