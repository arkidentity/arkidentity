import { after } from 'next/server';
import { getStudyWithMembers, formatSlot } from '@/lib/bibleStudies';
import { getStaff, type IowaStaff } from '@/lib/iowaStaff';
import { sendStudyAssignment, siteUrl } from '@/lib/email';
import { googleCalendarUrl } from '@/lib/ics';

// Email a staff member that a study is now on them. Runs after the response via
// `after()` (a bare promise gets frozen on Vercel). Failures are logged only —
// the assignment itself is already saved.
export function notifyAssignment(studyId: string, staffId: string, assignedBy: IowaStaff | null) {
  after(async () => {
    try {
      const [study, staff] = await Promise.all([getStudyWithMembers(studyId), getStaff(staffId)]);
      if (!study || !staff?.active) return;
      await sendStudyAssignment({
        to: staff.email,
        name: staff.name,
        // Don't say "Travis put you on point" to Travis.
        assignedBy: assignedBy && assignedBy.id !== staff.id ? assignedBy.name : null,
        study: { id: study.id, slot: formatSlot(study), location: study.location },
        activeCount: study.activeCount,
        capacity: study.capacity,
        icsUrl: `${siteUrl()}/api/iowa/studies/${study.id}/ics`,
        googleUrl: googleCalendarUrl({
          id: study.id,
          dayOfWeek: study.day_of_week,
          startTime: study.start_time,
          location: study.location,
        }),
      });
    } catch (e) {
      console.error('[iowa assignment] email failed', e);
    }
  });
}
