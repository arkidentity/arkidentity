import { NextResponse } from 'next/server';
import { importContacts, type ImportRow, type ContactChannel, type ContactFrequency } from '@/lib/contacts';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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

// POST /api/admin/contacts/import — body: { csv, tagIds? }
// Header columns (any order): name, email, phone, city, state, region, church,
// channel, frequency.
export async function POST(req: Request) {
  const { csv, tagIds } = (await req.json().catch(() => ({}))) as {
    csv?: string;
    tagIds?: string[];
  };
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
    city: header.indexOf('city'),
    state: header.indexOf('state'),
    region: header.indexOf('region'),
    church: header.indexOf('church'),
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
      city: idx.city >= 0 ? r[idx.city] : undefined,
      state: idx.state >= 0 ? r[idx.state] : undefined,
      region: idx.region >= 0 ? r[idx.region] : undefined,
      church: idx.church >= 0 ? r[idx.church] : undefined,
      channel: (['email', 'text', 'both'].includes(channel) ? channel : undefined) as ContactChannel | undefined,
      frequency: (['weekly', 'monthly'].includes(frequency) ? frequency : undefined) as ContactFrequency | undefined,
    };
  });

  try {
    const result = await importContacts(rows, { tagIds });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
