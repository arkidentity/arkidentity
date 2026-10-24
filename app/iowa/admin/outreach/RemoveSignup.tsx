'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Remove one sign-up (asks first). Frees the slot on the public sign-up page. */
export function RemoveSignup({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!window.confirm(`Remove ${name}'s sign-up? This frees their spot.`)) return;
    setBusy(true);
    const res = await fetch(`/api/iowa/admin/outreach-signup?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
    else window.alert('Couldn’t remove it. Try again.');
  };
  return (
    <button type="button" onClick={remove} disabled={busy} className="text-xs text-[#8a8378] underline shrink-0">
      {busy ? 'Removing…' : 'Remove'}
    </button>
  );
}
