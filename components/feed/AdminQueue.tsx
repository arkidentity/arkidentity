'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { videoLinkToMedia } from '@/lib/videoLinks';
import type { Post, PostStatus, MediaItem, MediaType } from '@/lib/feed';

const MEDIA_BUCKET = 'feed-media';
// Keep uploads within the Supabase per-file limit. Long video goes to YouTube
// and gets pasted as a link instead (no upload). Raise if you bump the plan.
const MAX_FILE_MB = 50;

function mediaTypeForFile(file: File): MediaType | null {
  if (file.type.startsWith('image/')) return 'photo';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Drafts — needs review',
  approved: 'Approved — ready to publish',
  published: 'Published',
};

const STATUS_ORDER: PostStatus[] = ['draft', 'approved', 'published'];

export function AdminQueue({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newText, setNewText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [videoLinks, setVideoLinks] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  function refresh() {
    router.refresh();
  }

  // Upload one file directly to Storage via a server-minted signed URL.
  async function uploadFile(file: File): Promise<MediaItem> {
    const type = mediaTypeForFile(file);
    if (!type) throw new Error(`Unsupported file: ${file.name}`);

    const signRes = await fetch('/api/admin/media/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    if (!signRes.ok) {
      throw new Error((await signRes.json().catch(() => ({}))).error || `Could not sign ${file.name}`);
    }
    const { path, token, publicUrl } = await signRes.json();

    const { error: upErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .uploadToSignedUrl(path, token, file, { contentType: file.type });
    if (upErr) throw new Error(`${file.name}: ${upErr.message}`);

    return { url: publicUrl, type };
  }

  function onSelectFiles(selected: File[]) {
    const tooBig = selected.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig.length > 0) {
      setError(
        `Too large (max ${MAX_FILE_MB} MB): ${tooBig
          .map((f) => f.name)
          .join(', ')}. For long video, upload to YouTube and paste the link below.`
      );
    } else {
      setError('');
    }
    setFiles(selected.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024));
  }

  async function createPost() {
    const links = videoLinks.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!newText.trim() && files.length === 0 && links.length === 0) return;
    setBusy('new');
    setError('');
    setProgress('');

    try {
      const media: MediaItem[] = [];

      // Validate + collect pasted video links first (no upload needed).
      for (const link of links) {
        const item = videoLinkToMedia(link);
        if (!item) {
          throw new Error(`Not a recognized YouTube/Vimeo link: ${link}`);
        }
        media.push(item);
      }

      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading ${i + 1} of ${files.length}…`);
        media.push(await uploadFile(files[i]));
      }
      setProgress('Saving update…');

      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: newText, media }),
      });
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).error || 'Failed to create update.');
      }
      const { post } = await res.json();
      setPosts((p) => [post, ...p]);
      setNewText('');
      setFiles([]);
      setVideoLinks('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      setProgress('');
    }
  }

  async function act(
    id: string,
    action: 'draft' | 'edit' | 'approve' | 'publish',
    final_text?: string
  ) {
    setBusy(id);
    setError('');
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, final_text }),
    });
    setBusy(null);
    if (res.ok) {
      const { post } = await res.json();
      setPosts((p) => p.map((x) => (x.id === id ? post : x)));
      // Edits to a published post change the live feed; refresh so the public
      // page reflects it (and publish, which adds it to the feed).
      if (action === 'publish' || action === 'edit') refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error || 'Action failed.');
    }
  }

  async function del(id: string, published: boolean) {
    const msg = published
      ? 'Delete this published update? It will be removed from the public feed.'
      : 'Delete this draft?';
    if (!window.confirm(msg)) return;
    setBusy(id);
    setError('');
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    setBusy(null);
    if (res.ok) {
      setPosts((p) => p.filter((x) => x.id !== id));
      if (published) refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error || 'Delete failed.');
    }
  }

  return (
    <div>
      {/* Composer — one update: photos/video + transcript together */}
      <div className="rounded-xl p-6 mb-10" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--navy)' }}>New update</h2>
        <p className="text-sm mb-4" style={{ color: '#8a8378' }}>
          Add the photos and video for this moment, and paste the voice-memo transcript or notes. Everything here becomes one update. Then “Draft with AI” turns the transcript into the written update in your voice.
        </p>

        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>
          Photos / short clips / audio <span className="font-normal" style={{ color: '#8a8378' }}>(up to {MAX_FILE_MB} MB each)</span>
        </label>
        <input
          type="file"
          accept="image/*,video/*,audio/*"
          multiple
          disabled={busy === 'new'}
          onChange={(e) => onSelectFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm mb-2"
          style={{ color: '#4a4540' }}
        />
        {files.length > 0 && (
          <ul className="mb-3 text-sm" style={{ color: '#8a8378' }}>
            {files.map((f, i) => (
              <li key={i}>• {f.name} ({(f.size / 1024 / 1024).toFixed(1)} MB)</li>
            ))}
          </ul>
        )}

        <label className="block text-sm font-semibold mb-1 mt-2" style={{ color: 'var(--navy)' }}>
          Video links <span className="font-normal" style={{ color: '#8a8378' }}>(YouTube / Vimeo, one per line)</span>
        </label>
        <textarea
          value={videoLinks}
          onChange={(e) => setVideoLinks(e.target.value)}
          rows={2}
          placeholder="https://youtu.be/…"
          className="w-full px-4 py-3 rounded-lg border mb-3"
          style={{ borderColor: '#d1d5db', color: '#111827' }}
        />

        <label className="block text-sm font-semibold mb-1 mt-2" style={{ color: 'var(--navy)' }}>
          Transcript / notes
        </label>
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={5}
          placeholder="Paste the Google Recorder transcript or jot field notes…"
          className="w-full px-4 py-3 rounded-lg border mb-3"
          style={{ borderColor: '#d1d5db', color: '#111827' }}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={createPost}
            disabled={busy === 'new' || (!newText.trim() && files.length === 0)}
            className="px-5 py-2.5 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--navy)', color: 'white' }}
          >
            {busy === 'new' ? 'Working…' : 'Save draft'}
          </button>
          {progress && <span className="text-sm" style={{ color: '#8a8378' }}>{progress}</span>}
        </div>
      </div>

      {error && <p className="mb-6 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

      {STATUS_ORDER.map((status) => {
        const group = posts.filter((p) => p.status === status);
        return (
          <section key={status} className="mb-10">
            <h2 className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>
              {STATUS_LABELS[status]} ({group.length})
            </h2>
            {group.length === 0 ? (
              <p className="text-sm" style={{ color: '#8a8378' }}>Nothing here.</p>
            ) : (
              group.map((post) => (
                <AdminCard key={post.id} post={post} busy={busy === post.id} onAct={act} onDelete={del} />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}

function AdminCard({
  post,
  busy,
  onAct,
  onDelete,
}: {
  post: Post;
  busy: boolean;
  onAct: (
    id: string,
    action: 'draft' | 'edit' | 'approve' | 'publish',
    final_text?: string
  ) => void;
  onDelete: (id: string, published: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(post.final_text ?? post.draft_text ?? '');
  const [copied, setCopied] = useState(false);
  const hasBody = !!(post.final_text || post.draft_text);

  const media = post.media ?? [];

  // Ready-to-send SMS for a manual Gloo broadcast: a short teaser + feed link.
  async function copyText() {
    const feedUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')}/feed`;
    const body = (post.final_text || '').replace(/\s+/g, ' ').trim();
    const teaser = body.split(/(?<=[.!?])\s/)[0] || body.slice(0, 140);
    const msg = `New from ARK Identity: ${teaser} Read: ${feedUrl}`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this text for Gloo:', msg);
    }
  }

  return (
    <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {media.map((m, i) =>
            m.type === 'photo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={m.url} alt="" className="h-20 w-20 object-cover rounded-lg" />
            ) : (
              <span
                key={i}
                className="h-20 w-20 flex items-center justify-center rounded-lg text-xs font-semibold"
                style={{ backgroundColor: '#f0ede8', color: '#8a8378' }}
              >
                {m.provider ? '▶ ' + m.provider : m.type === 'video' ? '🎬 video' : '🔊 audio'}
              </span>
            )
          )}
        </div>
      )}

      {post.transcript && (
        <details className="mb-3">
          <summary className="text-xs font-semibold uppercase tracking-wide cursor-pointer" style={{ color: '#8a8378' }}>
            Raw notes / transcript
          </summary>
          <p className="whitespace-pre-wrap mt-2 text-sm" style={{ color: '#8a8378' }}>
            {post.transcript}
          </p>
        </details>
      )}

      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border mb-3"
          style={{ borderColor: '#d1d5db', color: '#111827' }}
        />
      ) : (
        <p className="whitespace-pre-wrap mb-4 leading-relaxed" style={{ color: '#4a4540' }}>
          {post.final_text || post.draft_text || <em style={{ color: '#8a8378' }}>Not drafted yet — use “Draft with AI”.</em>}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <ActionBtn label="Save" disabled={busy} onClick={() => { onAct(post.id, 'edit', text); setEditing(false); }} />
            <ActionBtn label="Cancel" ghost onClick={() => { setText(post.final_text ?? ''); setEditing(false); }} />
          </>
        ) : (
          <>
            {post.status !== 'published' && post.transcript && (
              <ActionBtn
                label={busy ? 'Drafting…' : hasBody ? 'Re-draft with AI' : 'Draft with AI'}
                disabled={busy}
                onClick={() => onAct(post.id, 'draft')}
              />
            )}
            {hasBody && (
              <ActionBtn label="Edit" ghost disabled={busy} onClick={() => { setText(post.final_text ?? post.draft_text ?? ''); setEditing(true); }} />
            )}
            {post.status === 'draft' && hasBody && (
              <ActionBtn label="Approve" ghost disabled={busy} onClick={() => onAct(post.id, 'approve')} />
            )}
            {post.status === 'approved' && (
              <ActionBtn label="Publish" disabled={busy} onClick={() => onAct(post.id, 'publish')} />
            )}
            {post.status === 'published' && hasBody && (
              <ActionBtn label={copied ? 'Copied!' : 'Copy text for Gloo'} ghost onClick={copyText} />
            )}
            <ActionBtn
              label="Delete"
              danger
              disabled={busy}
              onClick={() => onDelete(post.id, post.status === 'published')}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  ghost,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ghost?: boolean;
  danger?: boolean;
}) {
  const style = danger
    ? { backgroundColor: 'transparent', color: '#b91c1c', border: '1px solid #f0c8c8' }
    : ghost
      ? { backgroundColor: 'transparent', color: 'var(--navy)', border: '1px solid #d1d5db' }
      : { backgroundColor: 'var(--navy)', color: 'white' };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
      style={style}
    >
      {label}
    </button>
  );
}
