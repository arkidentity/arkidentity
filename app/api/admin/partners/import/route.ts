import { NextResponse } from 'next/server';
import { importPartners, type ImportRow, type PartnerChannel, type PartnerFrequency } from '@/lib/partners';

export const maxDuration = 60;

// Minimal CSV parser: handles quoted fields and escaped quotes ("").
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== '')) rows.push(row);
  }
  return rows;
}

const norm = (s: string) => s.trim().toLowerCase();

// POST /api/admin/partners/import — body: { csv: string }
// Expected header columns (any order): name, email, phone, channel, frequency.
export async function POST(req: Request) {
  const { csv } = (await req.json().catch(() => ({}))) as { csv?: string };
  if (!csv?.trim()) {
    return NextResponse.json({ error: 'No CSV content.' }, { status: 400 });
  }

  const table = parseCsv(csv);
  if (table.length < 2) {
    return NextResponse.json({ error: 'CSV needs a header row and at least one row.' }, { status: 400 });
  }

  const header = table[0].map(norm);
  const idx = {
    name: header.indexOf('name'),
    email: header.indexOf('email'),
    phone: header.indexOf('phone'),
    channel: header.indexOf('channel'),
    frequency: header.indexOf('frequency'),
  };
  if (idx.name === -1) {
    return NextResponse.json({ error: "CSV must have a 'name' column." }, { status: 400 });
  }

  const rows: ImportRow[] = table.slice(1).map((r) => {
    const channel = idx.channel >= 0 ? norm(r[idx.channel] || '') : '';
    const frequency = idx.frequency >= 0 ? norm(r[idx.frequency] || '') : '';
    return {
      name: r[idx.name] || '',
      email: idx.email >= 0 ? r[idx.email] : undefined,
      phone: idx.phone >= 0 ? r[idx.phone] : undefined,
      channel: (['email', 'text', 'both'].includes(channel) ? channel : undefined) as PartnerChannel | undefined,
      frequency: (['weekly', 'monthly'].includes(frequency) ? frequency : undefined) as PartnerFrequency | undefined,
    };
  });

  try {
    const result = await importPartners(rows);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
