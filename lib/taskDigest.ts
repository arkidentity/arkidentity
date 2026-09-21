import { CURRENT_SEMESTER } from '@/lib/bibleStudies';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { listEvents, listTasks, type CampusTask } from '@/lib/campusTasks';
import { listStaff } from '@/lib/iowaStaff';
import { formatSlot, formatTime } from '@/lib/bibleStudyFormat';
import {
  PRIORITY,
  addDays,
  chicagoToday,
  compareTasks,
  dayOfWeek,
  eventDatesInRange,
  formatDate,
  isOverdue,
  weekDays,
  weekStart,
} from '@/lib/campusFormat';
import { escapeEmailHtml as esc, sendEmailBatch, siteUrl } from '@/lib/email';

// Scheduled task emails: "due tomorrow" (nightly, with the study reminders) and
// the Monday digest of each person's week. See docs/IOWA-CAMPUS-TASKS.md.

function taskLine(t: CampusTask, today: string): string {
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

// Tasks due tomorrow, one email per owner.
export async function sendTaskDueReminders(): Promise<{ recipients: number; sent: number; failed: number }> {
  const today = chicagoToday();
  const tomorrow = addDays(today, 1);
  const [tasks, staff] = await Promise.all([listTasks(), listStaff()]);
  const due = tasks.filter((t) => t.status !== 'done' && t.due_date === tomorrow && t.owner_id);

  const items = staff
    .filter((s) => s.active)
    .map((s) => ({ s, mine: due.filter((t) => t.owner_id === s.id) }))
    .filter((x) => x.mine.length > 0)
    .map(({ s, mine }) => ({
      to: s.email,
      subject: mine.length === 1 ? `Due tomorrow: ${mine[0].title}` : `${mine.length} tasks due tomorrow`,
      html: `<p>${esc(s.name)}, due tomorrow:</p><ul style="padding-left:18px;">${mine
        .sort((a, b) => compareTasks(a, b, today))
        .map((t) => taskLine(t, today))
        .join('')}</ul>`,
    }));

  const { sent, failed } = await sendEmailBatch(items);
  return { recipients: items.length, sent, failed };
}

// Monday morning: your studies, your events, and your open tasks this week.
export async function sendWeeklyDigests(): Promise<{ recipients: number; sent: number; failed: number }> {
  const today = chicagoToday();
  const start = weekStart(today);
  const end = addDays(start, 6);
  const days = weekDays(start);

  const db = getSupabaseAdmin();
  const [staff, tasks, events, studiesRes] = await Promise.all([
    listStaff(),
    listTasks(),
    listEvents(start, end),
    db
      .from('bible_studies')
      .select('id, day_of_week, start_time, location, point_staff_id')
      .eq('semester', CURRENT_SEMESTER)
      .in('status', ['forming', 'full', 'activated'])
      .not('point_staff_id', 'is', null),
  ]);
  if (studiesRes.error) throw studiesRes.error;
  const studies = studiesRes.data ?? [];

  const items = staff
    .filter((s) => s.active)
    .map((s) => {
      const lines: { date: string; time: string; text: string }[] = [];
      for (const st of studies.filter((x) => x.point_staff_id === s.id)) {
        const date = days.find((d) => dayOfWeek(d) === st.day_of_week)!;
        lines.push({
          date,
          time: st.start_time,
          text: `${formatSlot(st)} Bible study${st.location ? ` · ${st.location}` : ''}`,
        });
      }
      // Google-owned events don't know who's going, so they go to everyone.
      for (const e of events.filter((x) => x.source === 'google' || x.staff_ids.includes(s.id))) {
        for (const date of eventDatesInRange(e, start, end)) {
          lines.push({
            date,
            time: e.start_time ?? '00:00',
            text: `${e.title}${e.start_time ? ` · ${formatTime(e.start_time)}` : ''}${e.location ? ` · ${e.location}` : ''}`,
          });
        }
      }
      lines.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

      const mine = tasks
        .filter((t) => t.status !== 'done' && (t.owner_id === s.id || t.helper_ids.includes(s.id)))
        .sort((a, b) => compareTasks(a, b, today));
      return { s, lines, mine };
    })
    .filter((x) => x.lines.length > 0 || x.mine.length > 0)
    .map(({ s, lines, mine }) => {
      const overdue = mine.filter((t) => isOverdue(t, today)).length;
      const schedule = lines.length
        ? `<ul style="padding-left:18px;">${lines
            .map((l) => `<li style="margin:0 0 6px;"><strong style="color:#143348;">${formatDate(l.date)}</strong> — ${esc(l.text)}</li>`)
            .join('')}</ul>`
        : '<p style="color:#8a8378;">Nothing on the calendar for you.</p>';
      const taskList = mine.length
        ? `<ul style="padding-left:18px;">${mine.map((t) => taskLine(t, today)).join('')}</ul>`
        : '<p style="color:#8a8378;">No open tasks. Nice.</p>';
      return {
        to: s.email,
        subject: `Your week — ${formatDate(start, { month: 'short', day: 'numeric' })}${
          overdue ? ` · ${overdue} overdue` : ''
        }`,
        html: `
          <h1 style="color:#143348; font-size:22px;">Your week, ${esc(s.name.split(' ')[0])}</h1>
          <h2 style="color:#143348; font-size:16px; margin:20px 0 6px;">On the calendar</h2>
          ${schedule}
          <h2 style="color:#143348; font-size:16px; margin:20px 0 6px;">Open tasks (${mine.length})</h2>
          ${taskList}
          <p style="margin-top:24px;"><a href="${siteUrl()}/iowa/admin" style="color:#143348; font-weight:600;">Open the dashboard →</a></p>`,
      };
    });

  const { sent, failed } = await sendEmailBatch(items);
  return { recipients: items.length, sent, failed };
}
