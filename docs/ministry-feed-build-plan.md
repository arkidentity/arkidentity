# ARK Identity Ministry Feed — Build Plan

## Overview
A public, chronological feed on the existing ARK Identity Next.js site (`/feed`) where Travis drops photos, voice memos, and video. Content gets transcribed and drafted into short written updates in Travis's voice, reviewed/approved by Travis, published to the public feed, and delivered to ministry partners via email (and eventually text) on their own chosen frequency.

No partner accounts/login. Feed is fully public. Only `/admin` is gated (Travis only).

---

## Data Model (Postgres — Supabase or Neon)

### `posts`
| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| status | enum | `draft`, `approved`, `published` |
| raw_media_url | text | original photo/voice/video upload |
| media_type | enum | `photo`, `audio`, `video` |
| transcript | text | nullable, from audio/video |
| draft_text | text | AI-generated draft in Travis's voice |
| final_text | text | Travis's edited/approved version |
| display_media_url | text | processed image/video for feed display |
| created_at | timestamp | |
| approved_at | timestamp | nullable |
| published_at | timestamp | nullable |

### `partners`
| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| name | text | |
| email | text | nullable |
| phone | text | nullable |
| channel | enum | `email`, `text`, `both` |
| frequency | enum | `weekly`, `monthly` |
| active | boolean | default true |
| created_at | timestamp | |

### `sends`
| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| partner_id | uuid, fk → partners | |
| post_ids | uuid[] | posts included in this send |
| channel | enum | `email`, `text` |
| sent_at | timestamp | |
| status | enum | `sent`, `failed` |

---

## Routes

### Public
- `GET /feed` — chronological list of `posts` where `status = published`, newest first. Server-rendered.
- `GET /feed/subscribe` — simple form (name, email, phone, channel, frequency) → inserts into `partners`.

### Admin (basic auth, Travis only — no need for full auth system, just middleware password gate)
- `GET /admin` — queue of posts by status (draft → needs review, approved → ready to publish)
- `POST /admin/upload` — drop photo/audio/video, creates `posts` row with `status = draft`, kicks off transcription + AI draft
- `POST /admin/posts/:id/approve` — sets `final_text`, `status = approved`
- `POST /admin/posts/:id/publish` — sets `status = published`, `published_at = now()`
- `POST /admin/posts/:id/edit` — update `final_text` before approving

---

## AI Drafting Flow

1. Upload triggers processing:
   - Photo → no transcription needed, straight to draft step with any caption Travis adds
   - Audio/video → transcribe first (use a speech-to-text API, or Claude's audio input if using Claude API directly with audio support — confirm current capability before building)
2. Transcript (or caption) + optional context Travis types → sent to Claude API with a system prompt built from Travis's voice/tone reference material, asking for a short (2-4 paragraph) update in his voice.
3. Draft saved to `posts.draft_text`, status stays `draft` until Travis reviews in `/admin`.
4. Travis edits if needed → approves → publishes (can be same click or two-step).

**Do not auto-publish AI drafts.** Every post requires a manual approve step before it's live or sent.

---

## Delivery (Digest Sending)

- Scheduled job (Vercel Cron, e.g. daily trigger checking who's due)
- Logic: for each active partner, check `frequency` against last `sends.sent_at` for that partner. If due, gather all `posts` published since last send.
- If partner has no new posts since last send, skip (don't send an empty digest).
- Email: Resend, new subdomain (e.g. `updates.arkidentity.com`) to keep deliverability separate from DNA discipleship sending.
- Text: platform TBD (not Gloo — no confirmed API; likely Twilio). Build the `sends` logic channel-agnostic so whichever SMS provider gets picked later just slots into a `sendText()` function.
- Digest template: short list of new posts since last send, each with headline/excerpt + link to `/feed` for full content and media.

---

## Build Phases (suggested order)

1. **Schema + static feed** — DB tables, `/feed` page rendering seeded/manual posts. No AI yet. Confirms the core content model works.
2. **Admin approval flow** — `/admin` with manual text entry only (no AI drafting yet). Confirms the approve → publish pipeline.
3. **AI drafting** — wire up transcription + Claude drafting on upload. This is the highest-complexity phase; test with real voice memos from Travis early.
4. **Partner subscribe form + preferences** — `/feed/subscribe`, writes to `partners`.
5. **Digest sending** — cron job, Resend integration, `sends` logging to prevent duplicates.
6. **SMS** — added once a texting platform is chosen.

---

## Open Decisions (not blocking early phases)
- SMS/texting platform (deferred — Gloo has no confirmed public API, Twilio is the fallback)
- Speech-to-text provider for audio/video transcription
- Whether `/admin` upload happens from a phone (mobile-friendly upload UI) or desktop only — Travis will likely want to drop content from his phone in the field
