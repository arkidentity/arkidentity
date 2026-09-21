import { semesterContext } from '@/lib/semesters';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { listEvents, type CampusTask } from '@/lib/campusTasks';
import { formatSlot, formatTime } from '@/lib/bibleStudyFormat';
import { PRIORITY, addDays, eventDatesInRange, formatDate, isOverdue, studyMeetsOn } from '@/lib/campusFormat';
import { escapeEmailHtml as esc, siteUrl } from '@/lib/email';

// Building blocks for the one morning email (lib/campusAutomation.ts →
// runMorning): a task line, and each person's schedule for a date range.
// See docs/IOWA-CAMPUS-TASKS.md.

export function taskLine(t: CampusTask, today: string): string {
  const p = PRIORITY[t.priority];
  const bits = [
    `<span style="color:${p.color}; font-weight:600;">${p.label}</span>`,
    t.due_date
      ? isOverdue(t, today)
        ? `<span style="color:#b91c1c; font-weight:600;">overdue (${formatDate(t.due_date)})</span>`
        : `due ${formatDate(t.due_date)}`
      : null,
  ].filter(Boolean);
  return `<li style="margin:0 0 6px;"><a href="${siteUrl()}/iowa/admin/tasks?task=${t.id}" style="color:#143348;">${esc(
    t.title
  )}</a> <span style="color:#8a8378; font-size:14px;">· ${bits.join(' · ')}</span></li>`;
}

export interface ScheduleLine {
  date: string;
  time: string;
  text: string;
}

// Per staff member: studies they're on point for + campus events they're going
// to, on every date in [from, to]. `studies: false` = events only. Google-owned events don't know who's going,
// so they go to everyone in `staffIds`.
export async function schedulesFor(
  from: string,
  to: string,
  staffIds: string[],
  opts: { studies: boolean } = { studies: true }
): Promise<Map<string, ScheduleLine[]>> {
  const ctx = await semesterContext();
  const [events, studiesRes] = await Promise.all([
    listEvents(from, to),
    getSupabaseAdmin()
      .from('bible_studies')
      .select('id, day_of_week, start_time, location, point_staff_id, online, semester')
      .in('semester', ctx.active)
      .in('status', ['forming', 'full', 'activated'])
      .not('point_staff_id', 'is', null),
  ]);
  if (studiesRes.error) throw studiesRes.error;

  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);

  const out = new Map<string, ScheduleLine[]>();
  const push = (id: string, line: ScheduleLine) => out.set(id, [...(out.get(id) ?? []), line]);

  for (const st of opts.studies ? studiesRes.data ?? [] : []) {
    for (const date of days.filter((d) => studyMeetsOn(st, d, ctx.periods, ctx.semesters))) {
      push(st.point_staff_id as string, {
        date,
        time: st.start_time,
        text: `${formatSlot(st)} Bible study${st.location ? ` · ${st.location}` : ''}`,
      });
    }
  }
  for (const e of events) {
    const who = e.source === 'google' ? staffIds : e.staff_ids;
    for (const date of eventDatesInRange(e, from, to)) {
      const line = {
        date,
        time: e.start_time ?? '00:00',
        text: `${e.title}${e.start_time ? ` · ${formatTime(e.start_time)}` : ''}${e.location ? ` · ${e.location}` : ''}${
          e.meeting_link ? ' · online' : ''
        }`,
      };
      for (const id of who) push(id, line);
    }
  }
  for (const [id, lines] of out) out.set(id, lines.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
  return out;
}

export function scheduleHtml(lines: ScheduleLine[]): string {
  return `<ul style="padding-left:18px; margin:0;">${lines
    .map((l) => `<li style="margin:0 0 6px;"><strong style="color:#143348;">${formatDate(l.date)}</strong> — ${esc(l.text)}</li>`)
    .join('')}</ul>`;
}
