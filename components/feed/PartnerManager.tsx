'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Partner, PartnerChannel, PartnerFrequency } from '@/lib/partners';

const inputStyle = { borderColor: '#d1d5db', color: '#111827' } as const;

export function PartnerManager({ initialPartners }: { initialPartners: Partner[] }) {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // New partner form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<PartnerChannel>('email');
  const [frequency, setFrequency] = useState<PartnerFrequency>('monthly');

  async function addPartner() {
    if (!name.trim()) return;
    setBusy(true); setError('');
    const res = await fetch('/api/admin/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, channel, frequency }),
    });
    setBusy(false);
    if (res.ok) {
      const { partner } = await res.json();
      setPartners((p) => [partner, ...p]);
      setName(''); setEmail(''); setPhone('');
    } else {
      setError((await res.json().catch(() => ({}))).error || 'Could not add partner.');
    }
  }

  async function patch(id: string, body: Partial<Partner>) {
    const res = await fetch(`/api/admin/partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { partner } = await res.json();
      setPartners((p) => p.map((x) => (x.id === id ? partner : x)));
    } else {
      setError((await res.json().catch(() => ({}))).error || 'Update failed.');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this partner from the list?')) return;
    const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
    if (res.ok) setPartners((p) => p.filter((x) => x.id !== id));
    else setError('Delete failed.');
  }

  async function importCsv(file: File) {
    setBusy(true); setError(''); setNotice('');
    const csv = await file.text();
    const res = await fetch('/api/admin/partners/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    });
    setBusy(false);
    if (res.ok) {
      const { imported } = await res.json();
      setNotice(`Imported ${imported} partner${imported === 1 ? '' : 's'}.`);
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error || 'Import failed.');
    }
  }

  return (
    <div>
      {/* Import */}
      <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--navy)' }}>Import from CSV</h2>
        <p className="text-sm mb-3" style={{ color: '#8a8378' }}>
          Columns: <code>name, email, phone, channel, frequency</code> (channel = email/text/both, frequency = weekly/monthly). Existing emails are skipped.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }}
          className="text-sm"
          style={{ color: '#4a4540' }}
        />
        {notice && <p className="text-sm mt-2" style={{ color: '#8a8378' }}>{notice}</p>}
      </div>

      {/* Add one */}
      <div className="rounded-xl p-5 mb-8" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>Add a partner</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
          <div className="flex gap-3">
            <select value={channel} onChange={(e) => setChannel(e.target.value as PartnerChannel)} className="flex-1 px-3 py-2 rounded-lg border" style={inputStyle}>
              <option value="email">Email</option>
              <option value="text">Text</option>
              <option value="both">Both</option>
            </select>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as PartnerFrequency)} className="flex-1 px-3 py-2 rounded-lg border" style={inputStyle}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
        <button onClick={addPartner} disabled={busy || !name.trim()} className="px-5 py-2.5 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: 'var(--navy)', color: 'white' }}>
          Add partner
        </button>
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

      <p className="text-sm mb-3" style={{ color: '#8a8378' }}>{partners.length} partners</p>

      {/* List */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {partners.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 border-b" style={{ borderColor: '#f0ede8' }}>
            <div className="flex-1 min-w-[160px]">
              <p className="font-semibold" style={{ color: 'var(--navy)' }}>
                {p.name}{' '}
                {!p.confirmed && <span className="text-xs font-normal" style={{ color: '#b98900' }}>(pending)</span>}
                {!p.active && <span className="text-xs font-normal" style={{ color: '#b91c1c' }}> (unsubscribed)</span>}
              </p>
              <p className="text-sm" style={{ color: '#8a8378' }}>{p.email || p.phone}</p>
            </div>
            <select value={p.channel} onChange={(e) => patch(p.id, { channel: e.target.value as PartnerChannel })} className="px-2 py-1.5 rounded-lg border text-sm" style={inputStyle}>
              <option value="email">Email</option>
              <option value="text">Text</option>
              <option value="both">Both</option>
            </select>
            <select value={p.frequency} onChange={(e) => patch(p.id, { frequency: e.target.value as PartnerFrequency })} className="px-2 py-1.5 rounded-lg border text-sm" style={inputStyle}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <button onClick={() => patch(p.id, { active: !p.active })} className="text-sm font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
              {p.active ? 'Pause' : 'Resume'}
            </button>
            <button onClick={() => remove(p.id)} className="text-sm font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: '#f0c8c8', color: '#b91c1c' }}>
              Remove
            </button>
          </div>
        ))}
        {partners.length === 0 && <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>No partners yet. Import a CSV or add one above.</p>}
      </div>
    </div>
  );
}
