import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { IowaStaff } from '@/lib/iowaStaff';

// Files attached to a task (migration 029). The bucket is private: the browser
// uploads straight to Supabase with a signed URL (so a big PDF never passes
// through the serverless body limit), and downloads are signed on demand.

export const TASK_BUCKET = process.env.IOWA_TASK_BUCKET || 'iowa-task-files';
export const MAX_FILE_MB = 25;

export interface TaskFile {
  id: string;
  task_id: string;
  name: string;
  path: string;
  content_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

const COLS = 'id, task_id, name, path, content_type, size_bytes, uploaded_by, created_at';

export async function listTaskFiles(taskIds?: string[]): Promise<TaskFile[]> {
  let q = getSupabaseAdmin().from('iowa_task_files').select(COLS).order('created_at');
  if (taskIds) {
    if (taskIds.length === 0) return [];
    q = q.in('task_id', taskIds);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TaskFile[];
}

// Step one: a place to put it. Keeps only a safe extension from the name.
export async function signUpload(taskId: string, filename: string): Promise<{ path: string; token: string }> {
  const ext = (filename.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const objectPath = `${taskId}/${randomUUID()}${ext ? '.' + ext : ''}`;
  const { data, error } = await getSupabaseAdmin().storage.from(TASK_BUCKET).createSignedUploadUrl(objectPath);
  if (error) throw new Error(bucketHint(error.message));
  return { path: data.path, token: data.token };
}

// Step two: the upload landed, so record it.
export async function recordFile(
  taskId: string,
  file: { name: string; path: string; contentType?: string | null; size?: number | null },
  by: IowaStaff | null
): Promise<TaskFile> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_task_files')
    .insert({
      task_id: taskId,
      name: file.name.slice(0, 200),
      path: file.path,
      content_type: file.contentType ?? null,
      size_bytes: file.size ?? null,
      uploaded_by: by?.id ?? null,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return data as TaskFile;
}

// A link that works for a minute — long enough to open, short enough that a
// forwarded URL is useless.
export async function signDownload(fileId: string): Promise<{ url: string; name: string } | null> {
  const db = getSupabaseAdmin();
  const { data: file } = await db.from('iowa_task_files').select('path, name').eq('id', fileId).maybeSingle();
  if (!file) return null;
  const { data, error } = await db.storage.from(TASK_BUCKET).createSignedUrl(file.path as string, 60);
  if (error) throw new Error(bucketHint(error.message));
  return { url: data.signedUrl, name: file.name as string };
}

export async function deleteFile(fileId: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { data: file } = await db.from('iowa_task_files').select('path').eq('id', fileId).maybeSingle();
  if (!file) return;
  await db.storage.from(TASK_BUCKET).remove([file.path as string]);
  const { error } = await db.from('iowa_task_files').delete().eq('id', fileId);
  if (error) throw error;
}

// The one failure that isn't a bug: the bucket was never created.
function bucketHint(msg: string): string {
  return /not found|does not exist/i.test(msg)
    ? `The "${TASK_BUCKET}" storage bucket doesn't exist yet — create it (private) in Supabase.`
    : msg;
}
