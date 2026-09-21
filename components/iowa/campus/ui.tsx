'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRIORITY, TASK_STATUSES, type TaskPriority, type TaskStatus } from '@/lib/campusFormat';

// Shared bits for the campus dashboard, tasks and calendar screens.

export const input = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';
export const btnPrimary =
  'px-4 py-2 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50';
export const btnSmall =
  'text-xs font-semibold px-2 py-1 rounded border border-gray-300 transition hover:bg-gray-50 disabled:opacity-50';

export interface Option {
  id: string;
  label: string;
}
export interface StaffOption {
  id: string;
  name: string;
  active: boolean;
}
export interface TypeOption {
  id: string;
  kind: 'task' | 'event';
  name: string;
  active: boolean;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const p = PRIORITY[priority];
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: p.bg, color: p.color }}
    >
      {p.label}
    </span>
  );
}

export function OverdueTag() {
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 bg-red-600 text-white">Overdue</span>
  );
}

const STATUS_STYLE: Record<TaskStatus, { bg: string; color: string }> = {
  open: { bg: '#f3f4f6', color: '#374151' },
  in_progress: { bg: '#e0e7ff', color: '#3730a3' },
  blocked: { bg: '#fde68a', color: '#92400e' },
  done: { bg: '#dcfce7', color: '#166534' },
};

export function StatusPill({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: s.bg, color: s.color }}>
      {TASK_STATUSES.find((x) => x.key === status)!.label}
    </span>
  );
}

// A priority dot, for tight spaces like the week grid.
export function PriorityDot({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: PRIORITY[priority].color }}
      title={PRIORITY[priority].label}
    />
  );
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#8a8378' }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export type CallFn = (url: string, method: string, body?: unknown) => Promise<boolean>;

// fetch + error state + router.refresh(), the same pattern as the study admin.
export function useCall(): { call: CallFn; busy: boolean; error: string; setError: (s: string) => void } {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return false;
      }
      router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { call, busy, error, setError };
}

export function ErrorBox({ error }: { error: string }) {
  if (!error) return null;
  return <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>;
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh', color: '#1f2937' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    </div>
  );
}

// A card over the page: slides up from the bottom on phones, centered on
// wider screens. Closes on ✕, the backdrop, or Escape; the page underneath
// keeps its scroll position.
export function Modal({ title, sub, onClose, children }: { title: string; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-2xl max-h-[88vh] overflow-y-auto bg-[#FAF8F5] rounded-t-2xl md:rounded-2xl shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 pt-4 pb-3 bg-[#FAF8F5] border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight" style={{ color: 'var(--navy)' }}>{title}</h2>
            {sub && <div className="text-sm text-[#4a4540] mt-0.5">{sub}</div>}
          </div>
          <button onClick={onClose} className="shrink-0 text-2xl leading-none px-2 text-[#8a8378]" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
