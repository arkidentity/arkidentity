import { Resend } from 'resend';

// Server-only email sending via Resend. Uses a dedicated sending identity
// (ideally a subdomain like updates.arkidentity.com) so ministry-feed volume
// doesn't affect other ARK sending reputation.

let client: Resend | null = null;

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Missing RESEND_API_KEY.');
  client ??= new Resend(apiKey);
  return client;
}

function fromAddress(): string {
  // e.g. "ARK Identity <updates@updates.arkidentity.com>"
  return process.env.EMAIL_FROM || 'ARK Identity <onboarding@resend.dev>';
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arkidentity.com').replace(/\/$/, '');
}

const wrap = (inner: string) => `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2c2c2a; line-height: 1.6;">
    ${inner}
  </div>`;

export async function sendConfirmationEmail(to: string, name: string, confirmUrl: string) {
  const html = wrap(`
    <h1 style="color:#143348; font-size:22px;">Confirm your subscription</h1>
    <p>Hi ${escapeHtml(name || 'friend')},</p>
    <p>Tap the button below to confirm you'd like ministry updates from ARK Identity.</p>
    <p style="margin:28px 0;">
      <a href="${confirmUrl}" style="background:#143348; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600;">Confirm subscription</a>
    </p>
    <p style="color:#8a8378; font-size:14px;">If you didn't request this, you can ignore this email and nothing will happen.</p>
  `);

  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: 'Confirm your ARK Identity subscription',
    html,
  });
}

export interface DigestPost {
  id: string;
  headline: string;
  excerpt: string;
  imageUrl: string | null;
  // The raw YouTube/Vimeo watch URL when the post's lead media is an embedded
  // video. Email clients can't play video inline, so imageUrl carries the
  // poster frame and this becomes a direct "Watch the video" link that opens
  // a real, playable YouTube/Vimeo page instead of our own post page.
  videoUrl: string | null;
  publishedAt: string | null;
}

export async function sendDigestEmail(
  to: string,
  name: string,
  posts: DigestPost[],
  unsubscribeUrl: string
) {
  const feedUrl = `${siteUrl()}/feed`;

  const items = posts
    .map((p) => {
      const postUrl = `${siteUrl()}/feed/${p.id}`;
      // A video thumbnail links straight to YouTube/Vimeo — that's the one tap
      // that actually plays. The photo case still links back to our post page.
      const imageHref = p.videoUrl || postUrl;
      return `
    <div style="margin:0 0 28px; padding:0 0 24px; border-bottom:1px solid #eee;">
      ${
        p.imageUrl
          ? `<a href="${imageHref}" style="display:block; position:relative;">
               <img src="${p.imageUrl}" alt="" width="100%" style="display:block; border-radius:10px; margin-bottom:12px; max-height:260px; object-fit:cover;" />
               ${
                 p.videoUrl
                   ? `<span style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:56px; height:56px; line-height:56px; text-align:center; background:rgba(0,0,0,0.6); border-radius:50%; color:#fff; font-size:20px;">▶</span>`
                   : ''
               }
             </a>`
          : ''
      }
      ${p.headline ? `<h2 style="margin:0 0 8px; font-size:20px; line-height:1.3; color:#143348;">${escapeHtml(p.headline)}</h2>` : ''}
      <p style="margin:0 0 8px; font-size:16px; line-height:1.5; color:#4a4540;">${escapeHtml(p.excerpt)}</p>
      ${
        p.videoUrl
          ? `<a href="${p.videoUrl}" style="color:#143348; font-weight:600; text-decoration:none;">▶ Watch the video</a> &nbsp;·&nbsp; <a href="${postUrl}" style="color:#8a8378; text-decoration:none;">Read the update →</a>`
          : `<a href="${postUrl}" style="color:#143348; font-weight:600; text-decoration:none;">Read the full update →</a>`
      }
    </div>`;
    })
    .join('');

  const html = wrap(`
    <p style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#9d855a; margin:0 0 4px;">From the field</p>
    <h1 style="color:#143348; font-size:24px; margin:0 0 24px;">ARK Identity ministry update</h1>
    ${items}
    <p style="margin:24px 0 8px;">
      <a href="${feedUrl}" style="background:#143348; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600;">See everything on the feed</a>
    </p>
    <div style="margin:20px 0; padding:20px; background:#faf6ee; border-radius:10px; text-align:center;">
      <p style="margin:0 0 12px; color:#4a4540; font-size:15px;">Your partnership empowers us to make more disciples.</p>
      <a href="${siteUrl()}/giving" style="background:#e8b562; color:#143348; text-decoration:none; padding:11px 22px; border-radius:8px; font-weight:700; display:inline-block;">Support the mission</a>
    </div>
    <p style="color:#8a8378; font-size:13px; margin-top:32px;">
      You're receiving this because you partner with ARK Identity.
      <a href="${unsubscribeUrl}" style="color:#8a8378;">Unsubscribe</a>.
    </p>
  `);

  // Lead the subject with the first update's headline when there's just one.
  const subject =
    posts.length === 1 && posts[0].headline
      ? posts[0].headline
      : `ARK Identity update${posts.length > 1 ? ` (${posts.length} new)` : ''}`;

  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
  });
}

export interface TableSignup {
  name: string;
  phone: string;
  email?: string;
  availability: string[];
  bringing?: string;
  message?: string;
}

// A student picking a table time on /iowa. Goes to the campus inbox, not to a list.
export async function sendTableSignupEmail(signup: TableSignup) {
  const row = (label: string, value: string) =>
    `<p style="margin:0 0 6px;"><strong style="color:#143348;">${label}:</strong> ${escapeHtml(value)}</p>`;

  const html = wrap(`
    <h1 style="color:#143348; font-size:22px;">New table signup — ARK Iowa</h1>
    ${row('Name', signup.name)}
    ${row('Phone', signup.phone)}
    ${signup.email ? row('Email', signup.email) : ''}
    ${row('Free', signup.availability.join(', '))}
    ${signup.bringing ? row('Bringing', signup.bringing) : ''}
    ${signup.message ? row('Message', signup.message) : ''}
    <p style="margin:20px 0 0; color:#8a8378; font-size:14px;">
      Submitted ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT.
      Text them within 24 hours.
    </p>
  `);

  return getResend().emails.send({
    from: fromAddress(),
    to: process.env.IOWA_INBOX || 'travis@arkidentity.com',
    replyTo: signup.email || undefined,
    subject: `Table signup — ${signup.name}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

// ---------------------------------------------------------------------------
// ARK Iowa Bible Study system. See docs/IOWA-BIBLE-STUDY-SYSTEM.md.
// Voice follows messaging/iowa/booking/booking-copy.md — short, plain, human.
// ---------------------------------------------------------------------------

const IOWA_INBOX = () => process.env.IOWA_INBOX || 'travis@arkidentity.com';

export interface StudyEmailInfo {
  id: string;
  slot: string; // e.g. "Wed 8 AM"
  location: string | null;
}
export interface StudyContact {
  name: string;
  phone: string;
  role: 'leader' | 'member';
}

function contactList(contacts: StudyContact[]): string {
  if (contacts.length === 0) return '';
  const rows = contacts
    .map(
      (c) =>
        `<li style="margin:0 0 4px;">${escapeHtml(c.name)}${
          c.role === 'leader' ? ' (leader)' : ''
        } — <a href="tel:${c.phone.replace(/[^\d+]/g, '')}" style="color:#143348;">${escapeHtml(
          c.phone
        )}</a></li>`
    )
    .join('');
  return `<p style="margin:20px 0 6px; font-weight:600; color:#143348;">Your study</p><ul style="margin:0; padding-left:18px; color:#4a4540;">${rows}</ul>`;
}

// To the student who just joined.
export async function sendStudyConfirmation(opts: {
  to: string;
  name: string;
  study: StudyEmailInfo;
  roster: StudyContact[];
  googleUrl: string;
  icsUrl: string;
}) {
  const { to, name, study, roster, googleUrl, icsUrl } = opts;
  const where = study.location ? ` at ${escapeHtml(study.location)}` : '';
  const closing =
    roster.length > 0
      ? 'Save those numbers — that’s your study. Your name and number went to them too, so you can sort out a missed week or a ride. Can’t make it some week? Text them.'
      : 'You’re the first one in this study. We’ll pass along the others’ numbers as they join, and someone will text you this week either way.';
  const html = wrap(`
    <h1 style="color:#143348; font-size:22px;">You're in — ${escapeHtml(study.slot)} Bible study</h1>
    <p>${escapeHtml(name)}, you're set for the <strong>${escapeHtml(study.slot)}</strong> Bible study${where}.
       One hour a week. Someone from the study will text you this week.</p>
    <p style="margin:24px 0;">
      <a href="${googleUrl}" style="background:#143348; color:#fff; text-decoration:none; padding:11px 20px; border-radius:8px; font-weight:600; display:inline-block; margin:0 8px 8px 0;">Add to Google Calendar</a>
      <a href="${icsUrl}" style="border:1px solid #143348; color:#143348; text-decoration:none; padding:11px 20px; border-radius:8px; font-weight:600; display:inline-block;">Add to any other calendar</a>
    </p>
    ${contactList(roster)}
    <p style="color:#8a8378; font-size:14px; margin-top:24px;">${closing}</p>
  `);
  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: `You're in — ${study.slot} Bible study`,
    html,
  });
}

// To the students already in the study, and a sharper nudge to the leader.
export async function sendStudyRosterAlerts(opts: {
  study: StudyEmailInfo;
  newMemberName: string;
  newMemberPhone: string;
  existing: { email: string }[];
  leaderEmail?: string | null;
}) {
  const { study, newMemberName, newMemberPhone, existing, leaderEmail } = opts;
  const tel = newMemberPhone.replace(/[^\d+]/g, '');
  const sends: Promise<unknown>[] = [];

  for (const m of existing) {
    if (!m.email) continue;
    sends.push(
      getResend().emails.send({
        from: fromAddress(),
        to: m.email,
        subject: `${newMemberName} just joined your ${study.slot} study`,
        html: wrap(`
          <p><strong>${escapeHtml(newMemberName)}</strong> is joining your ${escapeHtml(
            study.slot
          )} Bible study${study.location ? ` at ${escapeHtml(study.location)}` : ''}.</p>
          <p>Their number: <a href="tel:${tel}" style="color:#143348;">${escapeHtml(newMemberPhone)}</a>. Send a hi.</p>
        `),
      })
    );
  }

  if (leaderEmail) {
    sends.push(
      getResend().emails.send({
        from: fromAddress(),
        to: leaderEmail,
        subject: `New student in your ${study.slot} study — send a welcome text`,
        html: wrap(`
          <p><strong>${escapeHtml(newMemberName)}</strong> just signed up for your ${escapeHtml(
            study.slot
          )} Bible study.</p>
          <p><a href="tel:${tel}" style="color:#143348;">${escapeHtml(newMemberPhone)}</a></p>
          <p>Text them a quick welcome now — "looking forward to meeting you, see you then." That first text is what gets someone to actually show up.</p>
        `),
      })
    );
  }

  await Promise.allSettled(sends);
}

// To Travis.
export async function sendStudyAdminAlert(opts: {
  kind: 'join' | 'start';
  study: StudyEmailInfo;
  member: { name: string; phone: string; email: string; year?: string | null };
  spotsLeft?: number;
  alsoInStudies?: string[]; // slot labels
}) {
  const { kind, study, member, spotsLeft, alsoInStudies } = opts;
  const row = (label: string, value: string) =>
    `<p style="margin:0 0 6px;"><strong style="color:#143348;">${label}:</strong> ${escapeHtml(value)}</p>`;
  const adminUrl = `${siteUrl()}/iowa/admin/studies`;

  const html = wrap(`
    <h1 style="color:#143348; font-size:22px;">${
      kind === 'start' ? 'New study to set up' : 'Study signup'
    } — ${escapeHtml(study.slot)}</h1>
    ${row('Name', member.name)}
    ${row('Phone', member.phone)}
    ${row('Email', member.email)}
    ${member.year ? row('Year', member.year) : ''}
    ${row('Study', `${study.slot}${study.location ? ` · ${study.location}` : ''}`)}
    ${
      kind === 'start'
        ? `<p style="margin:14px 0; color:#4a4540;">They're the first student. Set a location and take it out of pending setup in the <a href="${adminUrl}" style="color:#143348;">admin</a>.</p>`
        : typeof spotsLeft === 'number'
          ? row('Spots left now', String(spotsLeft))
          : ''
    }
    ${
      alsoInStudies && alsoInStudies.length
        ? `<p style="margin:14px 0; color:#9d855a;"><strong>Heads up:</strong> this phone is already active in ${escapeHtml(
            alsoInStudies.join(', ')
          )}.</p>`
        : ''
    }
    <p style="margin:20px 0 0; color:#8a8378; font-size:14px;">
      ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT.
    </p>
  `);

  return getResend().emails.send({
    from: fromAddress(),
    to: IOWA_INBOX(),
    replyTo: member.email || undefined,
    subject: `${kind === 'start' ? 'New study' : 'Study signup'} — ${member.name} → ${study.slot}`,
    html,
  });
}

// The evening-before reminder, sent to every active member of every study
// meeting tomorrow. Uses Resend's batch endpoint (≤100 per call) so ~200/week
// is one or two API calls, not hundreds.
export interface StudyReminderItem {
  to: string;
  name: string;
  slot: string;
  location: string | null;
}

export async function sendStudyReminderBatch(
  items: StudyReminderItem[]
): Promise<{ sent: number; failed: number }> {
  if (items.length === 0) return { sent: 0, failed: 0 };

  const payloads = items.map((it) => ({
    from: fromAddress(),
    to: it.to,
    subject: `Tomorrow — ${it.slot} Bible study`,
    html: wrap(`
      <p>${escapeHtml(it.name)}, your <strong>${escapeHtml(it.slot)}</strong> Bible study is
         tomorrow${it.location ? ` at ${escapeHtml(it.location)}` : ''}.</p>
      <p>See you there — text the group if you can't make it.</p>
    `),
  }));

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < payloads.length; i += 100) {
    const chunk = payloads.slice(i, i + 100);
    try {
      await getResend().batch.send(chunk);
      sent += chunk.length;
    } catch (e) {
      failed += chunk.length;
      console.error('[iowa reminders] batch failed', e);
    }
  }
  return { sent, failed };
}

// To a staff member when a study is put on them — they're the one who has to
// be in the room until a student leader takes it over.
export async function sendStudyAssignment(opts: {
  to: string;
  name: string;
  assignedBy: string | null;
  study: StudyEmailInfo;
  activeCount: number;
  capacity: number;
  googleUrl: string;
  icsUrl: string;
}) {
  const { to, name, assignedBy, study, activeCount, capacity, googleUrl, icsUrl } = opts;
  const where = study.location ? ` at ${escapeHtml(study.location)}` : '';
  const by = assignedBy ? `${escapeHtml(assignedBy)} put you on point for` : 'You’re on point for';
  const html = wrap(`
    <h1 style="color:#143348; font-size:22px;">You're on point — ${escapeHtml(study.slot)}</h1>
    <p>${escapeHtml(name)}, ${by} the <strong>${escapeHtml(study.slot)}</strong> Bible study${where}.
       That means you need to be there each week until a student leader takes it over.</p>
    <p>Roster right now: <strong>${activeCount} of ${capacity}</strong>.</p>
    <p style="margin:24px 0;">
      <a href="${googleUrl}" style="background:#143348; color:#fff; text-decoration:none; padding:11px 20px; border-radius:8px; font-weight:600; display:inline-block; margin:0 8px 8px 0;">Add to Google Calendar</a>
      <a href="${icsUrl}" style="border:1px solid #143348; color:#143348; text-decoration:none; padding:11px 20px; border-radius:8px; font-weight:600; display:inline-block;">Add to any other calendar</a>
    </p>
    <p><a href="${siteUrl()}/iowa/admin/studies" style="color:#143348;">Open the admin</a> to see the roster.</p>
  `);
  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: `You're on point — ${study.slot} Bible study`,
    html,
  });
}

// ---------------------------------------------------------------------------
// Campus tasks (docs/IOWA-CAMPUS-TASKS.md)
// ---------------------------------------------------------------------------

export interface TaskEmailInfo {
  id: string;
  title: string;
  priority: string; // label, e.g. "Urgent"
  due: string | null; // formatted, e.g. "Thu, Sep 24"
  description: string | null;
  linkedTo: string | null; // e.g. "Wed 8 PM study" / "Taco Night" / "Sam Lee"
}

function taskUrl(id: string): string {
  return `${siteUrl()}/iowa/admin/tasks?task=${id}`;
}

function taskBlock(t: TaskEmailInfo): string {
  const meta = [t.priority, t.due ? `due ${t.due}` : null, t.linkedTo].filter(Boolean).join(' · ');
  return `
    <div style="border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin:16px 0;">
      <p style="margin:0; font-weight:600; color:#143348;">${escapeHtml(t.title)}</p>
      <p style="margin:4px 0 0; color:#8a8378; font-size:14px;">${escapeHtml(meta)}</p>
      ${t.description ? `<p style="margin:10px 0 0; color:#4a4540;">${escapeHtml(t.description)}</p>` : ''}
    </div>
    <p><a href="${taskUrl(t.id)}" style="color:#143348; font-weight:600;">Open the task →</a></p>`;
}

export async function sendTaskAssigned(opts: { to: string; name: string; by: string | null; task: TaskEmailInfo }) {
  const { to, name, by, task } = opts;
  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: `New task: ${task.title}`,
    html: wrap(`
      <p>${escapeHtml(name)}, ${by ? `${escapeHtml(by)} gave you a task` : 'you have a new task'}.</p>
      ${taskBlock(task)}
    `),
  });
}

export async function sendTaskHelpOffered(opts: { to: string; name: string; helper: string; task: TaskEmailInfo }) {
  const { to, name, helper, task } = opts;
  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: `${helper} can help with: ${task.title}`,
    html: wrap(`
      <p>${escapeHtml(name)}, <strong>${escapeHtml(helper)}</strong> offered to help on your task.
         You're still the owner. Loop them in on what you need.</p>
      ${taskBlock(task)}
    `),
  });
}

// One email per person, sent in a Resend batch.
export async function sendEmailBatch(
  items: { to: string; subject: string; html: string }[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100).map((it) => ({ from: fromAddress(), ...it, html: wrap(it.html) }));
    try {
      await getResend().batch.send(chunk);
      sent += chunk.length;
    } catch (e) {
      failed += chunk.length;
      console.error('[iowa] batch send failed', e);
    }
  }
  return { sent, failed };
}

export { escapeHtml as escapeEmailHtml };

// ---------------------------------------------------------------------------
// Semester turnover (docs/IOWA-CAMPUS-TASKS.md → Semester turnover)
// ---------------------------------------------------------------------------

// To a study's student leader when next semester's planning opens.
export async function sendPlanLink(opts: {
  to: string;
  name: string;
  slot: string;
  semester: string;
  url: string;
  members: string[];
}) {
  const { to, name, slot, semester, url, members } = opts;
  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: `Plan your group for ${semester}`,
    html: wrap(`
      <h1 style="color:#143348; font-size:22px;">What's next for your ${escapeHtml(slot)} group?</h1>
      <p>${escapeHtml(name)}, ${escapeHtml(semester)} signups are open. Most people know their class schedule by now,
         so this is the time to set your group's day and time for next semester.</p>
      <p>You can keep the group together, or <strong>multiply</strong>: split into two groups at two times, each
         with room for new people. Pick who goes where.</p>
      ${members.length ? `<p style="color:#8a8378;">Your group right now: ${members.map(escapeHtml).join(', ')}</p>` : ''}
      <p style="margin:24px 0;">
        <a href="${url}" style="background:#143348; color:#fff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600; display:inline-block;">Plan ${escapeHtml(semester)}</a>
      </p>
      <p style="color:#8a8378; font-size:14px;">Only you have this link. Anyone in your group who isn't placed can still sign up on the website.</p>
    `),
  });
}

// To a student a planner carried into next semester's study.
export async function sendNextSemesterSeat(opts: {
  to: string;
  name: string;
  semester: string;
  slot: string;
  location: string | null;
  firstDate: string | null; // formatted
  googleUrl: string;
  icsUrl: string;
}) {
  const { to, name, semester, slot, location, firstDate, googleUrl, icsUrl } = opts;
  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: `You're in for ${semester}: ${slot} Bible study`,
    html: wrap(`
      <h1 style="color:#143348; font-size:22px;">You're in for ${escapeHtml(semester)}</h1>
      <p>${escapeHtml(name)}, your group is set: <strong>${escapeHtml(slot)}</strong>${location ? ` at ${escapeHtml(location)}` : ''}${
        firstDate ? `, starting ${escapeHtml(firstDate)}` : ''
      }.</p>
      <p style="margin:24px 0;">
        <a href="${googleUrl}" style="background:#143348; color:#fff; text-decoration:none; padding:11px 20px; border-radius:8px; font-weight:600; display:inline-block; margin:0 8px 8px 0;">Add to Google Calendar</a>
        <a href="${icsUrl}" style="border:1px solid #143348; color:#143348; text-decoration:none; padding:11px 20px; border-radius:8px; font-weight:600; display:inline-block;">Add to any other calendar</a>
      </p>
      <p style="color:#8a8378; font-size:14px;">Schedule change? Just reply and we'll find you a time that works.</p>
    `),
  });
}
