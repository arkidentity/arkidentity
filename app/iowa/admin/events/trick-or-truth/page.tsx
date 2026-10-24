import type { Metadata } from 'next';
import OutreachAdminPage from '../../outreach/page';

// Admin → Events → Trick or Truth: same screen as /iowa/admin/outreach (sign-ups per slot with Remove, debriefs).
// Route config can't be re-exported (Next.js reads it statically), so it's declared here.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — Trick or Truth' };

export default OutreachAdminPage;
