'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { videoLinkToMedia } from '@/lib/videoLinks';
import { uploadFileToStorage, mediaTypeForFile, MAX_FILE_MB } from '@/lib/uploadMedia';
import { useToast } from '@/components/ui/Toast';
import type { Post, PostStatus, MediaItem } from '@/lib/feed';

const ACTION_TOAST: Record<string, string> = {
  draft: 'Draft written',
  edit: 'Saved',
  update: 'Saved',
  approve: 'Approved',
  publish: 'Published to the feed',
};

// "Published Jul 4 · 2 photos · 1 video"
function cardSummary(post: Post): string {
  const media = post.media ?? [];
  const photos = media.filter((m) => m.type === 'photo').length;
  const videos = media.filter((m) => m.type !== 'photo').length;
  const date = post.published_at || post.created_at;
  const when = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const parts = [when];
  if (photos) parts.push(`${photos} photo${photos === 1 ? '' : 's'}`);
  if (videos) parts.push(`${videos} video${videos === 1 ? '' : 's'}`);
  return parts.filter(Boolean).join(' · ');
}

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Drafts — needs review',
  approved: 'Approved — ready to publish',
  published: 'Published',
};

const STATUS_ORDER: PostStatus[] = ['draft', 'approved', 'published'];

export function AdminQueue({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const { showToast } = useToast();
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
        media.push(await uploadFileToStorage(files[i]));
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
      showToast('Draft saved', 'success');
    } catch (e) {
      setError((e as Error).message);
      showToast((e as Error).message, 'error');
    } finally {
      setBusy(null);
      setProgress('');
    }
  }

  async function act(
    id: string,
    action: 'draft' | 'edit' | 'update' | 'approve' | 'publish',
    final_text?: string,
    media?: MediaItem[],
    headline?: string
  ) {
    setBusy(id);
    setError('');
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, final_text, media, headline }),
    });
    setBusy(null);
    if (res.ok) {
      const { post } = await res.json();
      setPosts((p) => p.map((x) => (x.id === id ? post : x)));
      // Edits to a published post change the live feed; refresh so the public
      // page reflects it (and publish, which adds it to the feed).
      if (action === 'publish' || action === 'edit' || action === 'update') refresh();
      showToast(ACTION_TOAST[action] || 'Done', 'success');
    } else {
      const msg = (await res.json().catch(() => ({}))).error || 'Action failed.';
      setError(msg);
      showToast(msg, 'error');
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
      showToast('Deleted', 'success');
    } else {
      const msg = (await res.json().catch(() => ({}))).error || 'Delete failed.';
      setError(msg);
      showToast(msg, 'error');
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
    action: 'draft' | 'edit' | 'update' | 'approve' | 'publish',
    final_text?: string,
    media?: MediaItem[],
    headline?: string
  ) => void;
  onDelete: (id: string, published: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState(post.headline ?? '');
  const [text, setText] = useState(post.final_text ?? post.draft_text ?? '');
  const [editMedia, setEditMedia] = useState<MediaItem[]>(post.media ?? []);
  const [newLink, setNewLink] = useState('');
  const [uploading, setUploading] = useState('');
  const [copied, setCopied] = useState(false);
  const hasBody = !!(post.final_text || post.draft_text);

  const media = post.media ?? [];

  function startEditing() {
    setHeadline(post.headline ?? '');
    setText(post.final_text ?? post.draft_text ?? '');
    setEditMedia(post.media ?? []);
    setNewLink('');
    setEditing(true);
  }

  async function addFiles(selected: File[]) {
    for (let i = 0; i < selected.length; i++) {
      if (selected[i].size > MAX_FILE_MB * 1024 * 1024) {
        setUploading(`"${selected[i].name}" is over ${MAX_FILE_MB} MB — use a YouTube link instead.`);
        continue;
      }
      setUploading(`Uploading ${i + 1} of ${selected.length}…`);
      try {
        const item = await uploadFileToStorage(selected[i]);
        setEditMedia((m) => [...m, item]);
      } catch (e) {
        setUploading((e as Error).message);
        return;
      }
    }
    setUploading('');
  }

  function addLink() {
    const item = videoLinkToMedia(newLink);
    if (!item) { setUploading('Not a recognized YouTube/Vimeo link.'); return; }
    setEditMedia((m) => [...m, item]);
    setNewLink('');
    setUploading('');
  }

  function saveEdit() {
    onAct(post.id, 'update', text, editMedia, headline);
    setEditing(false);
  }

  // Ready-to-send SMS for a manual Gloo broadcast: a short teaser + feed link.
  async function copyText() {
    // Link to THIS post so the text preview shows its headline + photo.
    const postUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')}/feed/${post.id}`;
    // Use the AI headline as the hook; fall back to the first sentence.
    const body = (post.final_text || '').replace(/\s+/g, ' ').trim();
    const hook = post.headline?.trim() || body.split(/(?<=[.!?])\s/)[0] || body.slice(0, 140);
    const msg = `${hook} — Read: ${postUrl}`;
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
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#b98a3a' }}>
        {cardSummary(post)}
      </p>

      {!editing && post.headline && (
        <h3 className="text-lg font-bold mb-2 leading-snug" style={{ color: 'var(--navy)' }}>
          {post.headline}
        </h3>
      )}

      {!editing && media.length > 0 && (
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
        <>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#8a8378' }}>
            Headline / text hook
          </label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="A short, catchy line…"
            className="w-full px-4 py-2.5 rounded-lg border mb-3 font-semibold"
            style={{ borderColor: '#d1d5db', color: '#111827' }}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 rounded-lg border mb-3"
            style={{ borderColor: '#d1d5db', color: '#111827' }}
          />

          {/* Editable media */}
          {editMedia.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {editMedia.map((m, i) => (
                <div key={i} className="relative">
                  {m.type === 'photo' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="h-20 w-20 object-cover rounded-lg" />
                  ) : (
                    <span className="h-20 w-20 flex items-center justify-center rounded-lg text-xs font-semibold" style={{ backgroundColor: '#f0ede8', color: '#8a8378' }}>
                      {m.provider ? '▶ ' + m.provider : m.type}
                    </span>
                  )}
                  <button
                    onClick={() => setEditMedia((arr) => arr.filter((_, j) => j !== i))}
                    aria-label="Remove"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: '#b91c1c', color: 'white' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-2">
            <label className="text-sm font-semibold px-3 py-1.5 rounded-lg border cursor-pointer" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
              + Add photos
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                multiple
                className="hidden"
                onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
              />
            </label>
            <div className="flex gap-2 flex-1 min-w-[220px]">
              <input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Paste a YouTube/Vimeo link"
                className="flex-1 px-3 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: '#d1d5db', color: '#111827' }}
              />
              <ActionBtn label="Add link" ghost onClick={addLink} />
            </div>
          </div>
          {uploading && <p className="text-sm mb-3" style={{ color: '#8a8378' }}>{uploading}</p>}
        </>
      ) : (
        <p className="whitespace-pre-wrap mb-4 leading-relaxed" style={{ color: '#4a4540' }}>
          {post.final_text || post.draft_text || <em style={{ color: '#8a8378' }}>Not drafted yet — use “Draft with AI”.</em>}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <ActionBtn label="Save" disabled={busy || !!uploading} onClick={saveEdit} />
            <ActionBtn label="Cancel" ghost onClick={() => setEditing(false)} />
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
            {(hasBody || media.length > 0) && (
              <ActionBtn label="Edit" ghost disabled={busy} onClick={startEditing} />
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
            {post.status === 'published' && (
              <a
                href={`/feed/${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: 'transparent', color: 'var(--navy)', border: '1px solid #d1d5db' }}
              >
                View on feed ↗
              </a>
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
