# /iowa/baja redesign: plan (human-made-sites test, 11/8)

Plan only. Nothing changed on the live page.

## Audit of the live page
Script (`ark-workspace/skills/human-made-sites/references/audit.js`): 1 flag, Arial. Visual audit: **6 tells.**

1. **Font is Arial.** The layout loads Geist, but `globals.css` line 91 sets `body { font-family: Arial }`, a leftover from the Next.js starter. This hits every ARK page, not only Baja.
2. **All-caps eyebrow with middle dots** in the hero ("ARK IOWA · BAJA, MEXICO · SUMMER 2027").
3. **Centered hero over a dark navy wash** on the photo, the stock web layout.
4. **Three identical numbered circles** (How you get there). It is a real sequence, so the numbers can stay, but the look is the template one.
5. **Grid of identical small rounded cards** (What the week looks like).
6. **Every section is the same narrow centered column** on the same cream background. No change in rhythm.

**What's already human (keep):** the words (specific, StoryBrand, "a mom walks through that door"), the real photos of our team building, and the "Friday afternoon" scene.

**Stale facts that cost sign-ups:** the hero button says "Hold my spot at the interest meeting," and step 2 says the meeting is in **October**, which has passed. The page also says "June or July." The trip is now **June 13–19, 2027.**

## Design plan (pass 1 → pass 2 changes noted)
- **Concept:** the build week itself. Monday is a slab in a dirt lot, and Friday a family walks in. The page runs Monday to Friday.
- **The one bold thing:** **"June 13–19"** set huge in a condensed stencil face, like the spray-painted lot number on a build site, over the roof photo (people on the roof, cropped so the faces show). *Pass 2: first idea was plywood texture everywhere. Cut it, because texture is decoration. Stencil appears once, in the date.*
- **Type:** Big Shoulders Stencil (display, the date only) + Public Sans (everything else). *Pass 2: swapped a serif body for Public Sans so the page doesn't drift into the cream + serif default.*
- **Color:** `--ink` #1a2b3c (ARK navy), `--paper` #ffffff (plain white, not cream), `--lumber` #d9b88a (sampled from the framing photo, used for section blocks), `--barn` #a5372b (the red wall in the roof photo, used for the action button only), `--gold` #e8b562 (brand, for small marks only).
- **Layout:**
  ```
  [ roof photo, full bleed, no wash          ]
  [ JUNE 13–19 (stencil, huge, bottom-left)   ]
  [ headline left-aligned · [Hold my spot]→right ]
  ---------------------------------------------
  Someday (narrow text column, left)
  MON ── TUE ── WED ── THU ── FRI   ← the week as a timeline (real sequence, replaces the 3 circles + card grid)
  slab   walls  roof   paint  keys    (one photo or line per day)
  Friday afternoon (full-bleed photo + the story, offset)
  The details (a plain two-column fact list) · Cost · [Hold my spot]
  ```
- **Hero rule:** no eyebrow, no wash; text sits on a solid ink band at the bottom of the photo.
- **Conversion:** one action, "Hold my spot," which now goes to the "I'm in" registration (the interest meeting has passed). Proof near it: "2 students already in" once true and confirmed. Sticky button on phones. Real deadline: "$200 deposit by Dec 15" (after uReach confirms).

## Before building
1. Travis approves the direction (lab: `/iowa/lab/baja` with the real copy, so he can try it on his phone).
2. Fix the Arial bug site-wide? It changes every ARK page's look, so it needs a separate yes.
3. uReach OK on the photos (already open).
