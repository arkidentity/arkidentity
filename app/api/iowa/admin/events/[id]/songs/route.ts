import { NextResponse } from 'next/server';
import { addSong, copySongs, removeSong, reorderSongs, updateSong } from '@/lib/eventSongs';
import { queueEventSync } from '@/lib/calendarSync';
import { currentStaff } from '@/lib/iowaStaff';
import { isValidDate } from '@/lib/campusFormat';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/events/:id/songs — the setlist for ONE date.
//   { occurrence, title, song_key?, link? }        add a song
//   { occurrence, order: [songId, …] }             reorder
//   { occurrence, copyFrom: { eventId?, occurrence } }   copy a set onto this date
//   { songId, title?/song_key?/link? }             edit one
//   { remove: songId }                             delete one
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    occurrence?: string;
    title?: string;
    song_key?: string | null;
    link?: string | null;
    order?: string[];
    copyFrom?: { eventId?: string; occurrence?: string };
    songId?: string;
    remove?: string;
  };
  try {
    const me = await currentStaff();
    if (body.remove) {
      await removeSong(body.remove);
    } else if (body.songId) {
      await updateSong(body.songId, body);
    } else if (body.occurrence && isValidDate(body.occurrence)) {
      const occurrence = body.occurrence;
      if (Array.isArray(body.order)) {
        await reorderSongs(id, occurrence, body.order);
      } else if (body.copyFrom?.occurrence && isValidDate(body.copyFrom.occurrence)) {
        await copySongs(
          { eventId: body.copyFrom.eventId || id, occurrence: body.copyFrom.occurrence },
          { eventId: id, occurrence },
          me
        );
      } else {
        await addSong(id, occurrence, { title: body.title ?? '', song_key: body.song_key, link: body.link }, me);
      }
    } else {
      return NextResponse.json({ error: 'Which date?' }, { status: 400 });
    }
    // The set rides along to Google in the event description.
    queueEventSync(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
