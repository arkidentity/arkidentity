'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRIORITY, TASK_STATUSES, type TaskPriority, type TaskStatus } from '@/lib/campusFormat';
import type { Permission } from '@/lib/iowaPerms';

// Shared bits for the campus dashboard, tasks and calendar screens.

// 16px text so iPhone Safari doesn't zoom in when a field is tapped.
export const input = 'w-full px-3 py-2 min-h-11 border border-gray-300 rounded-md text-base sm:text-sm text-gray-900 bg-white';
export const btnPrimary =
  'px-4 py-2 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50';
export const btnSmall =
  'inline-flex items-center justify-center min-h-9 text-sm font-semibold px-3 rounded-md border border-[#143348]/40 text-[#143348] bg-white transition hover:bg-[#143348]/5 disabled:opacity-50';

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
  uses_songs?: boolean; // event types: show the Songs section (migration 039)
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
      <span className="block text-sm font-semibold mb-1" style={{ color: '#6b645a' }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={title ? 'mb-10' : ''}>
      {(title || action) && (
        <div className="flex items-baseline justify-between gap-3 mb-3">
          {title && (
            <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// A settings group that stays shut until you need it. The hint is what the
// group is for, so you can tell from the closed state whether to open it.
export function Disclosure({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-3 rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#FAF8F5]"
      >
        <span>
          <span className="block font-bold" style={{ color: 'var(--navy)' }}>{title}</span>
          <span className="block text-xs text-[#8a8378] mt-0.5">{hint}</span>
        </span>
        <span className="text-sm shrink-0" style={{ color: '#8a8378' }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-gray-100">{children}</div>}
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pt-8">{children}</div>
    </div>
  );
}

// A card over the page, centered with breathing room on every screen size
// (a bottom sheet felt cramped on phones). Closes on ✕, the backdrop, or
// Escape; the page underneath keeps its scroll position.
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
    // Full screen on a phone (a screen of its own, above the tab bar), a card on bigger screens.
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[85dvh] overflow-y-auto bg-[#FAF8F5] sm:rounded-2xl shadow-xl">
        {/* Navy title block: you're "inside" something (lab /iowa/lab/look). */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 pt-4 pb-4 sm:rounded-t-2xl"
          style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', background: '#143348', color: '#fff' }}
        >
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight">{title}</h2>
            {sub && <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{sub}</div>}
          </div>
          <button onClick={onClose} className="shrink-0 text-2xl leading-none px-2 min-h-11" style={{ color: 'rgba(255,255,255,0.75)' }} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// Text / Email buttons for a person. Text opens Messages (sms:), not a call —
// texting is how staff reach students. Renders nothing without details.
export function ContactButtons({ phone, email, size = 'sm' }: { phone?: string | null; email?: string | null; size?: 'xs' | 'sm' }) {
  if (!phone && !email) return null;
  const cls =
    (size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1.5') +
    ' inline-flex items-center rounded-md font-semibold border border-gray-300 bg-white hover:bg-gray-50 transition';
  return (
    <span className="inline-flex gap-1.5 align-middle">
      {phone && (
        <a href={`sms:${phone.replace(/[^\d+]/g, '')}`} onClick={(e) => e.stopPropagation()} className={cls} style={{ color: 'var(--navy)' }}>
          Text
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} onClick={(e) => e.stopPropagation()} className={cls} style={{ color: 'var(--navy)' }}>
          Email
        </a>
      )}
    </span>
  );
}

// What the signed-in person may do, so a screen can hide buttons the API would
// refuse (a student leader tapping Drop and getting "You can only see your own
// study"). No provider means everything — the staff-only pages don't need one.
// The API still enforces every rule; this only keeps dead buttons off screen.
const CanContext = createContext<Permission[] | null>(null);
export function CanProvider({ allowed, children }: { allowed: Permission[]; children: React.ReactNode }) {
  return <CanContext.Provider value={allowed}>{children}</CanContext.Provider>;
}
export function useCan(): (p: Permission) => boolean {
  const allowed = useContext(CanContext);
  return (p) => allowed === null || allowed.includes(p);
}

// "Open this study / event" from anywhere inside a screen (a task's "For …"
// line). The screen that shows a calendar provides it; elsewhere it's null and
// callers fall back to a link to the Calendar tab.
export type OpenItem = { kind: 'study' | 'event'; id: string; date?: string | null };
const OpenItemContext = createContext<((o: OpenItem) => void) | null>(null);
export const OpenItemProvider = OpenItemContext.Provider;
export function useOpenItem() {
  return useContext(OpenItemContext);
}

// ---------------------------------------------------------------------------
// The admin's look (lab /iowa/lab/look, Travis 11/13). Navy = where you are,
// what you picked and what's next; white cards = lists; gold = the one "do this".
// ---------------------------------------------------------------------------
export const NAVY = '#143348';
export const NAVY2 = '#1e4560';
export const ON_NAVY_MUTED = 'rgba(255,255,255,0.68)';
export const GOLD = '#E8B562';

// The navy header every list screen opens with: title on the left, your numbers
// top-right, filters (children) underneath. Full width on a phone, a rounded
// block on bigger screens. The page's container should start with pt-4 sm:pt-8.
export function ScreenHeader({
  kicker,
  title,
  numbers,
  children,
}: {
  kicker?: React.ReactNode;
  title: string;
  numbers?: { n: number | string; label: string; warn?: boolean }[];
  children?: React.ReactNode;
}) {
  return (
    <header
      className="-mx-4 -mt-4 sm:mx-0 sm:mt-0 sm:rounded-2xl px-5 pt-6 pb-5 mb-5"
      style={{ background: NAVY, color: '#fff', paddingTop: 'max(24px, env(safe-area-inset-top))' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {kicker && <p className="text-sm" style={{ color: ON_NAVY_MUTED }}>{kicker}</p>}
          <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
        </div>
        {numbers && numbers.length > 0 && (
          <div className="flex gap-4 shrink-0 pt-1 text-right">
            {numbers.map((x) => (
              <div key={x.label}>
                <p className="text-[22px] font-bold leading-none" style={{ color: x.warn ? '#ffb3a7' : '#fff' }}>{x.n}</p>
                <p className="text-[13px] mt-1 leading-tight" style={{ color: ON_NAVY_MUTED }}>{x.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}

// Filter chips that sit inside a ScreenHeader: the picked one is white.
export function NavyChips<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { v: V; label: string; warn?: boolean }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div className="flex gap-2 mt-4 overflow-x-auto -mx-5 px-5 pb-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className="shrink-0 px-3.5 min-h-9 rounded-full text-sm font-semibold"
          style={value === o.v ? { background: '#fff', color: NAVY } : { background: NAVY2, color: o.warn ? '#ffb3a7' : '#fff' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// One tap to hand a task to someone: a native picker dressed as a button, so on
// a phone it opens the system list straight away (11/14, Travis).
export function AssignSelect({
  staff, ownerId, meId, disabled, onPick, className = '', label = 'Assign',
}: {
  staff: StaffOption[]; ownerId: string | null; meId: string | null; disabled?: boolean; onPick: (id: string) => void; className?: string; label?: string;
}) {
  const people = staff.filter((p) => p.active).sort((a, b) => (a.id === meId ? -1 : b.id === meId ? 1 : a.name.localeCompare(b.name)));
  return (
    <label className={`relative shrink-0 inline-flex items-center justify-center px-4 min-h-11 rounded-lg text-sm font-semibold border ${className}`} style={{ borderColor: NAVY, color: NAVY }}>
      {label} ▾
      <select
        aria-label="Assign to"
        disabled={disabled}
        value=""
        onChange={(e) => e.target.value && onPick(e.target.value)}
        className="absolute inset-0 opacity-0 w-full"
      >
        <option value="">Assign to…</option>
        {people.map((p) => (
          <option key={p.id} value={p.id} disabled={p.id === ownerId}>
            {p.id === meId ? `Me (${p.name.split(' ')[0]})` : p.name}{p.id === ownerId ? ' (has it)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
