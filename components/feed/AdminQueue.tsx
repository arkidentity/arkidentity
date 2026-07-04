'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Post, PostStatus } from '@/lib/feed';

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
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  function refresh() {
    router.refresh();
  }

  async function createPost() {
    if (!newText.trim()) return;
    setBusy('new');
    setError('');
    const res = await fetch('/api/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ final_text: newText }),
    });
    setBusy(null);
    if (res.ok) {
      const { post } = await res.json();
      setPosts((p) => [post, ...p]);
      setNewText('');
    } else {
      setError((await res.json().catch(() => ({}))).error || 'Failed to create post.');
    }
  }

  async function act(id: string, action: 'edit' | 'approve' | 'publish', final_text?: string) {
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
      if (action === 'publish') refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error || 'Action failed.');
    }
  }

  return (
    <div>
      {/* Create */}
      <div className="rounded-xl p-6 mb-10" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>New update</h2>
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={5}
          placeholder="Write an update…"
          className="w-full px-4 py-3 rounded-lg border mb-3"
          style={{ borderColor: '#d1d5db', color: '#111827' }}
        />
        <button
          onClick={createPost}
          disabled={busy === 'new' || !newText.trim()}
          className="px-5 py-2.5 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--navy)', color: 'white' }}
        >
          {busy === 'new' ? 'Saving…' : 'Save draft'}
        </button>
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
                <AdminCard key={post.id} post={post} busy={busy === post.id} onAct={act} />
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
}: {
  post: Post;
  busy: boolean;
  onAct: (id: string, action: 'edit' | 'approve' | 'publish', final_text?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(post.final_text ?? post.draft_text ?? '');

  return (
    <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 rounded-lg border mb-3"
          style={{ borderColor: '#d1d5db', color: '#111827' }}
        />
      ) : (
        <p className="whitespace-pre-wrap mb-4 leading-relaxed" style={{ color: '#4a4540' }}>
          {post.final_text || post.draft_text || <em>(no text)</em>}
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
            {post.status !== 'published' && (
              <ActionBtn label="Edit" ghost disabled={busy} onClick={() => setEditing(true)} />
            )}
            {post.status === 'draft' && (
              <ActionBtn label="Approve" disabled={busy} onClick={() => onAct(post.id, 'approve')} />
            )}
            {post.status === 'approved' && (
              <ActionBtn label="Publish" disabled={busy} onClick={() => onAct(post.id, 'publish')} />
            )}
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
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ghost?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
      style={
        ghost
          ? { backgroundColor: 'transparent', color: 'var(--navy)', border: '1px solid #d1d5db' }
          : { backgroundColor: 'var(--navy)', color: 'white' }
      }
    >
      {label}
    </button>
  );
}
