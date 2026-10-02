#!/usr/bin/env node
// Friday Fill Up: Meet recording -> lean teaching clip -> YouTube.
//
//   node scripts/friday-fill-up/fillup.mjs prepare [video.mp4]  find, transcribe, plan the edit, render
//   node scripts/friday-fill-up/fillup.mjs render <date>         re-render after editing edit.md
//   node scripts/friday-fill-up/fillup.mjs upload <date>         upload unlisted + thumbnail + playlist
//   node scripts/friday-fill-up/fillup.mjs auth                  one-time YouTube sign-in
//   node scripts/friday-fill-up/fillup.mjs auto                  prepare + upload the newest new recording (launchd)
//
// See README.md in this folder for setup.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

const HOME = os.homedir();
const CONFIG_DIR = path.join(HOME, '.config/friday-fill-up');
const WORK_ROOT = path.join(HOME, 'Friday Fill Up');
const NOTES_DIR = path.join(WORK_ROOT, 'notes');
const DRIVE = path.join(HOME, 'Library/CloudStorage/GoogleDrive-thearkidentity@gmail.com/My Drive');
// Meet saves into 'Google Meet/Meet Recordings' or a per-event folder beside it; search all of them.
const RECORDINGS_DIR = path.join(DRIVE, 'Google Meet');
const WHISPER_MODEL = path.join(CONFIG_DIR, 'ggml-base.en.bin');
const PLAYLIST_ID = 'PLbNdNOkBi1PmoyMVth2kuFleM5ROAkjzU';
const MODEL = 'claude-opus-5-5';

// Edit tuning
const PAUSE_MIN = 0.9; // gaps longer than this (seconds) get shortened
const PAUSE_KEEP = 0.35; // ...down to this much silence
const FILLER = /^(u+m+|u+h+|uhm|umm|er+|ah+|hmm+)[,.!?]*$/i;

const NAVY = '#1a2b3c';
const GOLD = '#e8b562';

loadEnv();

// ---------- helpers ----------

function loadEnv() {
  const f = path.join(CONFIG_DIR, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

function run(cmd, args) {
  return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString();
}

function log(msg) {
  console.log(`· ${msg}`);
}

function notify(msg) {
  try {
    run('osascript', ['-e', `display notification ${JSON.stringify(msg)} with title "Friday Fill Up"`]);
  } catch {}
}

const ts = (s) => {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
};
const parseTs = (t) => {
  const parts = t.split(':').map(Number);
  return parts.reduce((acc, n) => acc * 60 + n, 0);
};

function duration(file) {
  return Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim());
}

function workDir(date) {
  return path.join(WORK_ROOT, date);
}

// ---------- find recording ----------

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function findRecordings() {
  return walk(RECORDINGS_DIR)
    // Synced names look like "Friday Fill Up - 2026 10 09 07:55 CDT - Recording" (often no extension).
    .filter((p) => /Friday Fill Up/i.test(path.basename(p)) && /- Recording(\.(mp4|mov|webm))?$/i.test(path.basename(p)))
    .map((p) => {
      const m = path.basename(p).match(/(\d{4})[ /:-](\d{2})[ /:-](\d{2})/);
      const date = m ? `${m[1]}-${m[2]}-${m[3]}` : fs.statSync(p).mtime.toISOString().slice(0, 10);
      return { path: p, date };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ---------- transcribe ----------

function transcribe(dir, video) {
  const out = path.join(dir, 'words.json');
  if (fs.existsSync(out)) return JSON.parse(fs.readFileSync(out, 'utf8'));
  if (!fs.existsSync(WHISPER_MODEL)) throw new Error(`Speech model missing: ${WHISPER_MODEL} (see README)`);
  log('extracting audio');
  const wav = path.join(dir, 'audio.wav');
  run('ffmpeg', ['-y', '-v', 'error', '-i', video, '-ar', '16000', '-ac', '1', wav]);
  log('transcribing (a few minutes)');
  run('whisper-cli', [
    '-m', WHISPER_MODEL, '-f', wav, '-l', 'en', '-ml', '1', '-sow', '-oj', '-of', path.join(dir, 'whisper'),
    '--prompt', 'Um, uh, so, okay. Um, I mean, uh, you know.',
  ]);
  const raw = JSON.parse(fs.readFileSync(path.join(dir, 'whisper.json'), 'utf8'));
  const words = raw.transcription
    .map((s) => ({ t0: s.offsets.from / 1000, t1: s.offsets.to / 1000, w: s.text.trim() }))
    .filter((w) => w.w && !/^\[.*\]$/.test(w.w));
  fs.writeFileSync(out, JSON.stringify(words));
  fs.rmSync(wav, { force: true });
  return words;
}

// Group words into readable lines with a start time, for Claude and for people.
function lines(words) {
  const out = [];
  let cur = null;
  for (const w of words) {
    if (!cur) cur = { t0: w.t0, t1: w.t1, text: w.w };
    else {
      cur.text += ' ' + w.w;
      cur.t1 = w.t1;
    }
    if (/[.?!]$/.test(w.w) || cur.text.length > 160) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ---------- plan the edit ----------

// Pauses come from the audio itself: whisper stretches word timings across silences.
function mechanicalCuts(words, video) {
  const cuts = [];
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', video, '-af', `silencedetect=noise=-35dB:d=${PAUSE_MIN}`, '-vn', '-f', 'null', '-'], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  let start = null;
  for (const line of stderr.split('\n')) {
    const a = line.match(/silence_start: ([\d.]+)/);
    const b = line.match(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/);
    if (a) start = Number(a[1]);
    if (b && start !== null) {
      const pad = PAUSE_KEEP / 2;
      cuts.push({ start: start + pad, end: Number(b[1]) - pad, reason: `pause ${Number(b[2]).toFixed(1)}s` });
      start = null;
    }
  }
  for (const w of words) {
    if (FILLER.test(w.w)) cuts.push({ start: w.t0, end: w.t1, reason: `filler "${w.w}"` });
  }
  return cuts;
}

const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sections', 'slow_cuts', 'title', 'description', 'thumbnail_text', 'thumbnail_time'],
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['start', 'end', 'label'],
        properties: { start: { type: 'number' }, end: { type: 'number' }, label: { type: 'string' } },
      },
    },
    slow_cuts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['start', 'end', 'reason'],
        properties: { start: { type: 'number' }, end: { type: 'number' }, reason: { type: 'string' } },
      },
    },
    title: { type: 'string' },
    description: { type: 'string' },
    thumbnail_text: { type: 'string' },
    thumbnail_time: { type: 'number' },
  },
};

async function planWithClaude(transcriptLines, notes) {
  if (!process.env.ANTHROPIC_API_KEY) {
    log('no ANTHROPIC_API_KEY: keeping the whole recording, no slow-part cuts');
    return null;
  }
  log('asking Claude to find the teaching and the slow parts');
  const client = new Anthropic();
  const transcript = transcriptLines.map((l) => `[${l.t0.toFixed(1)}] ${l.text}`).join('\n');
  const prompt = `This is a transcript of Friday Fill Up, a 30-minute Google Meet for college students: Travis Gluckler teaches for about 15 minutes, then the group discusses. Times in brackets are seconds from the start of the recording.

We are publishing ONLY Travis's own words (his teaching, plus his closing if he gives one) as a lean YouTube clip. The discussion stays private: students share personal stories there.

1. sections: the parts to keep, in order, each with start/end seconds and a label.
   - "teaching": start after greetings, waiting for people, tech checks, and the opening prayer. End right before Travis hands it to the group (his first discussion question) or anyone else speaks.
   - "closing": if, after the discussion, Travis gives closing thoughts that pull the teaching together and/or prays the group out, keep that too, from his transition ("I want to close with this...") through his final "amen". This is often the culmination of the teaching. Skip it if the end is only logistics or goodbyes.
   - Never include a section where anyone other than Travis is speaking. Students' words stay private. Start a section after another person's last word (including their "amen"), and end it before anyone else speaks.
2. slow_cuts: stretches INSIDE the teaching that slow it down and can go without losing meaning or breaking a sentence: restarts and false starts, saying the same point twice in a row, asides about logistics or tech, rambling setups. Cut whole sentences, start and end on sentence boundaries from the transcript times. Be conservative: never cut Scripture being read, a story's payoff, or the main point. Usually 0-6 cuts. Pauses and "um"s are handled separately; ignore them.
3. title: a YouTube title, plain words, under 70 characters. ${notes ? 'Base it on the notes title.' : ''}
4. description: ${notes ? 'Return the notes below exactly as written.' : 'A short blog-style summary of the teaching in Travis\'s voice: 2-4 short paragraphs, plain words, no church jargon, then the main Scripture references on their own line.'}
5. thumbnail_text: 2-5 punchy words for the thumbnail.
6. thumbnail_time: a moment mid-sentence in the teaching (seconds) for the thumbnail frame.
${notes ? `\n<notes>\n${notes}\n</notes>\n` : ''}
<transcript>
${transcript}
</transcript>`;

  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: { type: 'json_schema', schema: PLAN_SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });
  if (res.stop_reason === 'refusal') throw new Error('Claude declined to plan this edit');
  const text = res.content.find((b) => b.type === 'text')?.text;
  return JSON.parse(text);
}

function readNotes(date) {
  const f = path.join(NOTES_DIR, `${date}.md`);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim() : '';
}

function writeEditList(dir, { sections, cuts, sourceDuration }) {
  const inside = (c) => sections.some((r) => c.end > r.start && c.start < r.end);
  const sorted = cuts.filter(inside).sort((a, b) => a.start - b.start);
  const md = `# Edit list

Times are in the ORIGINAL recording. Under "Keep", each line is a section that
goes in the clip, in order; add, remove, or change lines. Under "Cuts", change
a box to [ ] to put that part back, or add your own line. Then run:
  node scripts/friday-fill-up/fillup.mjs render ${path.basename(dir)}

Recording length: ${ts(sourceDuration)}

## Keep
${sections.map((r) => `- ${ts(r.start)} -> ${ts(r.end)}  ${r.label}`).join('\n')}

## Cuts
${sorted.map((c) => `- [x] ${ts(c.start)} -> ${ts(c.end)}  ${c.reason}`).join('\n')}
`;
  fs.writeFileSync(path.join(dir, 'edit.md'), md);
}

function readEditList(dir) {
  const md = fs.readFileSync(path.join(dir, 'edit.md'), 'utf8');
  const keepBlock = md.split(/^## Keep\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  const sections = [...keepBlock.matchAll(/^- ([\d:.]+)\s*->\s*([\d:.]+)/gm)].map((m) => ({ start: parseTs(m[1]), end: parseTs(m[2]) }));
  if (!sections.length) throw new Error('edit.md has no lines under "## Keep"');
  const cuts = [...md.matchAll(/^- \[[xX]\]\s*([\d:.]+)\s*->\s*([\d:.]+)/gm)].map((m) => ({
    start: parseTs(m[1]),
    end: parseTs(m[2]),
  }));
  return { sections, cuts };
}

function keepSegments({ sections, cuts }) {
  return sections.flatMap(({ start, end }) => keepRange(start, end, cuts));
}

function keepRange(start, end, cuts) {
  const merged = [];
  for (const c of cuts.filter((c) => c.end > c.start).sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1);
    if (last && c.start <= last.end) last.end = Math.max(last.end, c.end);
    else merged.push({ ...c });
  }
  const keep = [];
  let t = start;
  for (const c of merged) {
    if (c.end <= start || c.start >= end) continue;
    if (c.start > t) keep.push([t, Math.min(c.start, end)]);
    t = Math.max(t, c.end);
  }
  if (t < end) keep.push([t, end]);
  return keep.filter(([a, b]) => b - a > 0.12);
}

// ---------- render ----------

function render(dir) {
  const plan = readEditList(dir);
  const segs = keepSegments(plan);
  const video = path.join(dir, 'source.mp4');
  log(`rendering ${segs.length} segments`);
  const f = 0.012; // tiny audio fade on each join so cuts don't click
  const parts = segs.map(([a, b], i) => {
    const d = (b - a).toFixed(3);
    return (
      `[0:v]trim=${a.toFixed(3)}:${b.toFixed(3)},setpts=PTS-STARTPTS[v${i}];` +
      `[0:a]atrim=${a.toFixed(3)}:${b.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=${f},afade=t=out:st=${(d - f).toFixed(3)}:d=${f}[a${i}];`
    );
  });
  const graph = parts.join('') + segs.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${segs.length}:v=1:a=1[v][a]`;
  const graphFile = path.join(dir, 'filter.txt');
  fs.writeFileSync(graphFile, graph);
  const out = path.join(dir, 'clip.mp4');
  run('ffmpeg', [
    '-y', '-v', 'error', '-i', video, '-/filter_complex', graphFile, '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out,
  ]);
  const kept = segs.reduce((s, [a, b]) => s + b - a, 0);
  const total = plan.sections.reduce((s, r) => s + r.end - r.start, 0);
  log(`clip.mp4: ${ts(kept)} (kept sections were ${ts(total)}, cut ${ts(total - kept)})`);
  return out;
}

// ---------- thumbnail ----------

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(text, max) {
  const out = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max && line) {
      out.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}

async function thumbnail(dir, video, time, text) {
  const frame = path.join(dir, 'frame.jpg');
  run('ffmpeg', ['-y', '-v', 'error', '-ss', String(time), '-i', video, '-frames:v', '1', '-q:v', '2', frame]);
  const W = 1280;
  const H = 720;
  const lines = wrap(text.toUpperCase(), 14).slice(0, 3);
  const size = lines.length > 2 ? 92 : 108;
  const y0 = H / 2 - ((lines.length - 1) * size * 1.05) / 2 + size * 0.35;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" x2="1">
    <stop offset="0" stop-color="${NAVY}" stop-opacity="0.96"/>
    <stop offset="0.55" stop-color="${NAVY}" stop-opacity="0.8"/>
    <stop offset="1" stop-color="${NAVY}" stop-opacity="0"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="64" y="70" width="8" height="${H - 140}" fill="${GOLD}"/>
  <text x="100" y="128" font-family="Helvetica Neue, Helvetica, Arial" font-weight="700" font-size="34" letter-spacing="6" fill="${GOLD}">FRIDAY FILL UP</text>
  ${lines.map((l, i) => `<text x="96" y="${y0 + i * size * 1.05}" font-family="Helvetica Neue, Helvetica, Arial" font-weight="800" font-size="${size}" fill="#ffffff">${esc(l)}</text>`).join('\n  ')}
  <text x="100" y="${H - 84}" font-family="Helvetica Neue, Helvetica, Arial" font-weight="600" font-size="28" letter-spacing="4" fill="#ffffff" fill-opacity="0.85">ARK IDENTITY</text>
</svg>`;
  const out = path.join(dir, 'thumbnail.jpg');
  await sharp(frame)
    .resize(W, H, { fit: 'cover', position: 'right' })
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 88 })
    .toFile(out);
  fs.rmSync(frame, { force: true });
  return out;
}

// Map a time in the original recording to the same moment in the clip.
function clipTime(plan, t) {
  let acc = 0;
  for (const [a, b] of keepSegments(plan)) {
    if (t >= a && t <= b) return acc + (t - a);
    acc += b - a;
  }
  return Math.min(acc / 2, 60);
}

// ---------- prepare ----------

async function prepare(videoArg, { transcriptOnly = false } = {}) {
  let rec;
  if (videoArg) {
    const m = path.basename(videoArg).match(/(\d{4})[ /:-](\d{2})[ /:-](\d{2})/);
    rec = { path: path.resolve(videoArg), date: m ? `${m[1]}-${m[2]}-${m[3]}` : new Date().toISOString().slice(0, 10) };
  } else {
    rec = findRecordings()[0];
    if (!rec) throw new Error(`No Friday Fill Up recording found under ${RECORDINGS_DIR}`);
  }
  const dir = workDir(rec.date);
  fs.mkdirSync(dir, { recursive: true });
  log(`recording: ${path.basename(rec.path)} -> ${dir}`);

  const video = path.join(dir, 'source.mp4');
  if (!fs.existsSync(video)) {
    log('copying recording from Drive');
    fs.copyFileSync(rec.path, video);
  }
  const sourceDuration = duration(video);
  const words = transcribe(dir, video);
  const tl = lines(words);
  fs.writeFileSync(path.join(dir, 'transcript.txt'), tl.map((l) => `[${ts(l.t0)}] ${l.text}`).join('\n'));

  if (transcriptOnly) {
    log(`transcript ready: ${path.join(dir, 'transcript.txt')}`);
    return dir;
  }
  const notes = readNotes(rec.date);
  const plan = await planWithClaude(tl, notes);
  const sections = plan?.sections?.length ? plan.sections : [{ start: 0, end: sourceDuration, label: 'whole recording' }];
  const cuts = [
    ...(plan?.slow_cuts ?? []).map((c) => ({ ...c, reason: `slow: ${c.reason}` })),
    ...mechanicalCuts(words, video),
  ];
  writeEditList(dir, { sections, cuts, sourceDuration });

  const title = plan?.title || notes.match(/^#\s+(.+)$/m)?.[1] || `Friday Fill Up ${rec.date}`;
  const description = notes ? notes.replace(/^#\s+.+\n+/, '') : plan?.description ?? '';
  fs.writeFileSync(path.join(dir, 'title.txt'), title + '\n');
  fs.writeFileSync(path.join(dir, 'description.txt'), description.trim() + '\n');
  fs.writeFileSync(
    path.join(dir, 'plan.json'),
    JSON.stringify({ thumbnail_text: plan?.thumbnail_text || title, thumbnail_time: plan?.thumbnail_time ?? sections[0].start + 60 }, null, 2),
  );

  await finish(dir);
  return dir;
}

async function finish(dir) {
  const clip = render(dir);
  const { thumbnail_text, thumbnail_time } = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json'), 'utf8'));
  await thumbnail(dir, clip, clipTime(readEditList(dir), thumbnail_time), thumbnail_text);
  log(`done. Review in ${dir}: clip.mp4, thumbnail.jpg, title.txt, description.txt, edit.md`);
}

// ---------- cut: sections chosen outside the script (e.g. by a Claude session) ----------

// node fillup.mjs cut 2026-10-09 "01:21.0-15:30.6 teaching" "25:09.9-30:25.0 closing"
async function cut(date, specs) {
  const dir = workDir(date);
  const video = path.join(dir, 'source.mp4');
  const words = JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8'));
  const sections = specs.map((spec) => {
    const m = spec.match(/^([\d:.]+)\s*-\s*([\d:.]+)\s*(.*)$/);
    if (!m) throw new Error(`bad section "${spec}" (use "MM:SS.s-MM:SS.s label")`);
    return { start: parseTs(m[1]), end: parseTs(m[2]), label: m[3] || 'section' };
  });
  writeEditList(dir, { sections, cuts: mechanicalCuts(words, video), sourceDuration: duration(video) });
  const planFile = path.join(dir, 'plan.json');
  if (!fs.existsSync(planFile)) fs.writeFileSync(planFile, JSON.stringify({ thumbnail_text: `Friday Fill Up`, thumbnail_time: sections[0].start + 60 }, null, 2));
  for (const f of ['title.txt', 'description.txt']) if (!fs.existsSync(path.join(dir, f))) fs.writeFileSync(path.join(dir, f), '\n');
  await finish(dir);
}

// ---------- YouTube ----------

const TOKEN_FILE = path.join(CONFIG_DIR, 'token.json');
const SECRET_FILE = path.join(CONFIG_DIR, 'client_secret.json');
const SCOPE = 'https://www.googleapis.com/auth/youtube';

function clientSecret() {
  if (!fs.existsSync(SECRET_FILE)) throw new Error(`Missing ${SECRET_FILE} (see README: YouTube setup)`);
  const j = JSON.parse(fs.readFileSync(SECRET_FILE, 'utf8'));
  return j.installed || j.web;
}

async function auth() {
  const { client_id, client_secret } = clientSecret();
  const port = 53682;
  const redirect = `http://127.0.0.1:${port}`;
  const url =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({ client_id, redirect_uri: redirect, response_type: 'code', scope: SCOPE, access_type: 'offline', prompt: 'consent' });
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const c = new URL(req.url, redirect).searchParams.get('code');
      res.end(c ? 'Signed in. You can close this tab.' : 'No code received.');
      server.close();
      c ? resolve(c) : reject(new Error('sign-in cancelled'));
    });
    server.listen(port, '127.0.0.1', () => {
      log('opening Google sign-in in your browser');
      run('open', [url]);
    });
  });
  const tok = await (
    await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({ code, client_id, client_secret, redirect_uri: redirect, grant_type: 'authorization_code' }),
    })
  ).json();
  if (!tok.refresh_token) throw new Error('No refresh token returned: ' + JSON.stringify(tok));
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ refresh_token: tok.refresh_token }), { mode: 0o600 });
  log('YouTube connected');
}

async function accessToken() {
  const { client_id, client_secret } = clientSecret();
  const { refresh_token } = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  const tok = await (
    await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({ refresh_token, client_id, client_secret, grant_type: 'refresh_token' }),
    })
  ).json();
  if (!tok.access_token) throw new Error('YouTube token refresh failed: ' + JSON.stringify(tok));
  return tok.access_token;
}

async function yt(token, url, init = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`YouTube ${res.status}: ${await res.text()}`);
  return res;
}

async function upload(date) {
  const dir = workDir(date);
  const done = path.join(dir, 'uploaded.json');
  if (fs.existsSync(done)) {
    log(`already uploaded: ${JSON.parse(fs.readFileSync(done, 'utf8')).url}`);
    return;
  }
  const token = await accessToken();
  const title = fs.readFileSync(path.join(dir, 'title.txt'), 'utf8').trim().slice(0, 100);
  const description = fs.readFileSync(path.join(dir, 'description.txt'), 'utf8').trim().slice(0, 4900);
  const clip = path.join(dir, 'clip.mp4');
  const size = fs.statSync(clip).size;

  log('uploading clip (unlisted)');
  const init = await yt(token, 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(size) },
    body: JSON.stringify({
      snippet: { title, description, categoryId: '29', tags: ['Friday Fill Up', 'ARK Identity', 'Bible study'] },
      status: { privacyStatus: 'unlisted', selfDeclaredMadeForKids: false },
    }),
  });
  const video = await (
    await yt(token, init.headers.get('location'), {
      method: 'PUT',
      headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(size) },
      body: fs.readFileSync(clip),
    })
  ).json();

  log('setting thumbnail');
  await yt(token, `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${video.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg' },
    body: fs.readFileSync(path.join(dir, 'thumbnail.jpg')),
  }).catch((e) => log(`thumbnail skipped: ${e.message.slice(0, 200)}`));

  log('adding to playlist');
  await yt(token, 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snippet: { playlistId: PLAYLIST_ID, resourceId: { kind: 'youtube#video', videoId: video.id } } }),
  });

  const url = `https://youtu.be/${video.id}`;
  fs.writeFileSync(done, JSON.stringify({ id: video.id, url }, null, 2));
  log(`uploaded unlisted: ${url}  (set it to Public in YouTube Studio when it looks right)`);
  notify(`Teaching clip is up (unlisted). Review it: ${url}`);
}

// ---------- auto (launchd) ----------

async function auto() {
  const rec = findRecordings()[0];
  if (!rec) return log('no recording yet');
  const dir = workDir(rec.date);
  if (fs.existsSync(path.join(dir, 'clip.mp4'))) return log(`already prepared ${rec.date}`);
  // No API key: just transcribe. The Friday Claude scheduled task picks the sections and renders.
  const keyless = !process.env.ANTHROPIC_API_KEY;
  if (keyless && fs.existsSync(path.join(dir, 'words.json'))) return log(`already transcribed ${rec.date}`);
  // Drive may still be syncing a fresh file: wait until its size stops changing.
  const s1 = fs.statSync(rec.path).size;
  await new Promise((r) => setTimeout(r, 30_000));
  if (fs.statSync(rec.path).size !== s1) return log('recording still syncing, will try next run');

  await prepare(rec.path, { transcriptOnly: keyless });
  if (keyless) return;
  if (fs.existsSync(TOKEN_FILE)) await upload(rec.date);
  else notify(`Teaching clip ready to review in ~/Friday Fill Up/${rec.date}`);
}

// ---------- main ----------

const [cmd, arg, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'prepare') await prepare(arg);
  else if (cmd === 'render') {
    if (!arg) throw new Error('usage: render <YYYY-MM-DD>');
    await finish(workDir(arg));
  } else if (cmd === 'upload') {
    if (!arg) throw new Error('usage: upload <YYYY-MM-DD>');
    await upload(arg);
  } else if (cmd === 'cut') {
    if (!arg || !rest.length) throw new Error('usage: cut <YYYY-MM-DD> "MM:SS.s-MM:SS.s label" ...');
    await cut(arg, rest);
  } else if (cmd === 'auth') await auth();
  else if (cmd === 'auto') await auto();
  else console.log('usage: fillup.mjs prepare [video] | render <date> | upload <date> | auth | auto');
} catch (e) {
  console.error(`✗ ${e.message}`);
  if (cmd === 'auto') notify(`Friday Fill Up automation failed: ${e.message.slice(0, 120)}`);
  process.exit(1);
}
