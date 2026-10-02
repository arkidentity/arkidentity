# Friday Fill Up: recording → teaching clip → YouTube

Runs on Travis's Mac. Every Friday it takes the Meet recording from Google
Drive, cuts it down to Travis's teaching (plus his closing thoughts and prayer when he gives them), trims pauses / "um"s / slow parts,
makes a thumbnail, and uploads the clip **unlisted** to the Friday Fill Up
playlist. You watch it and flip it to Public. Public videos show up on
arkidentity.com/friday within the hour.

The discussion is never published. Students share personal stories there.

## Each week

1. **Before Friday (optional):** save the teaching notes as
   `~/Friday Fill Up/notes/YYYY-MM-DD.md`. First line `# Title` becomes the
   YouTube title; the rest becomes the description (and the notes on the
   website). No notes file → Claude drafts a short description from the
   transcript.
2. **Friday 10am / 2pm:** the automation runs by itself. You get a Mac
   notification when the clip is ready.
3. **Review:** open `~/Friday Fill Up/YYYY-MM-DD/`:
   - `clip.mp4` — the edited teaching
   - `edit.md` — every cut, one per line. Change `[x]` to `[ ]` to put a part
     back, or change the sections under `## Keep`. Then re-render:
     `node scripts/friday-fill-up/fillup.mjs render YYYY-MM-DD`
   - `thumbnail.jpg`, `title.txt`, `description.txt` — edit freely
   - `transcript.txt` — full transcript with times, handy for editing `edit.md`
4. **Publish:** if it was uploaded, set it to Public in YouTube Studio. If not
   uploaded yet: `node scripts/friday-fill-up/fillup.mjs upload YYYY-MM-DD`
   (if you re-rendered after an upload, delete `uploaded.json` and the old
   video first).

Run any step by hand from the `ark-identity` folder:

```
node scripts/friday-fill-up/fillup.mjs prepare            # newest recording
node scripts/friday-fill-up/fillup.mjs prepare path.mp4   # a specific file
```

## What it does

| Step | Tool | Cost |
|---|---|---|
| Find recording | Google Drive for desktop (`My Drive/Google Meet`) | free |
| Transcribe with word timings | whisper.cpp, local | free |
| Shorten pauses > 0.9s to 0.35s, cut "um"/"uh" | script | free |
| Find the teaching + closing sections, slow parts, title, description | Claude Opus 5.5 | ~5–15¢ |
| Cut + join (tiny audio fade at each join) | ffmpeg | free |
| Thumbnail (video frame + navy/gold overlay) | sharp | free |
| Upload unlisted, thumbnail, add to playlist | YouTube Data API | free |

## One-time setup

Already on this Mac: ffmpeg, whisper-cli, Drive for desktop, and the speech
model at `~/.config/friday-fill-up/ggml-base.en.bin`.

**1. Claude key.** Create a key at console.anthropic.com → API Keys, then:

```
echo 'ANTHROPIC_API_KEY=sk-ant-...' > ~/.config/friday-fill-up/.env
```

Without it, the pipeline still runs but keeps the whole recording (pauses
and "um"s are still trimmed).

**2. YouTube upload** (optional; until then upload `clip.mp4` by hand in
YouTube Studio):

1. console.cloud.google.com → new project "Friday Fill Up".
2. APIs & Services → Library → enable **YouTube Data API v3**.
3. OAuth consent screen → External → add yourself
   (thearkidentity@gmail.com) as a test user.
4. Credentials → Create OAuth client ID → **Desktop app** → download JSON →
   save as `~/.config/friday-fill-up/client_secret.json`.
5. `node scripts/friday-fill-up/fillup.mjs auth` and sign in with the
   account that owns the YouTube channel.

Note: until Google audits the project, API uploads may be locked to private.
If that happens, request the audit (YouTube API Services → Audit form) and
upload by hand meanwhile. Custom thumbnails also need a phone-verified channel.

**3. Turn on the Friday schedule:**

```
cp scripts/friday-fill-up/com.arkidentity.friday-fill-up.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.arkidentity.friday-fill-up.plist
```

The Mac must be awake (or asleep, not shut down) Friday morning. Log:
`~/Friday Fill Up/automation.log`. If macOS asks whether `node` may access
Google Drive files, allow it.

## Tuning

Top of `fillup.mjs`: `PAUSE_MIN`, `PAUSE_KEEP`, the filler-word list, and the
Claude prompt in `planWithClaude` (what counts as "slow").
