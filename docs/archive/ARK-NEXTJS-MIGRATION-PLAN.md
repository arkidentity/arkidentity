# ARK Identity — Next.js Migration & Unified App Plan

**Date:** March 2026  
**Status:** Planning Phase  
**Goal:** Combine the ARK PWA and arkidentity.com brochure site into one unified Next.js app on Vercel

---

## What We're Building

A single Next.js application that serves as:
1. **A PWA** — courses, journal, prayer tools for active users
2. **A public-facing brand site** — about, beliefs, giving, campus info for donors and churches

Everything lives on `arkidentity.com`. One codebase. One Vercel deployment.

---

## Route Structure

```
arkidentity.com/              → Course library (public homepage)
arkidentity.com/courses       → All courses
arkidentity.com/courses/[slug] → Individual course/session
arkidentity.com/tools         → Journal + Prayer (consolidated tools page)
arkidentity.com/community     → Community page (existing)
arkidentity.com/about         → Brochure — mission, story, pillars
arkidentity.com/beliefs       → What We Believe + PDF download
arkidentity.com/give          → Giving page (existing embedded forms)
arkidentity.com/vision        → Vision 2026
arkidentity.com/campus        → Campus ministry info
arkidentity.com/settings      → Settings menu with links
```

**Auth-gated routes:** `/courses/[slug]`, `/tools`, `/community`, `/settings`  
**Public routes:** `/`, `/courses` (library view), `/about`, `/beliefs`, `/give`, `/vision`, `/campus`

---

## Phase 1 — Audit (Before Any Code)

### 1A. Audit the Existing Next.js Brochure Build
- Inventory what pages are already built on the brochure site
- Identify what's complete, what's placeholder, what's missing
- Pull the reusable components (nav, footer, brand styles, color tokens)

### 1B. Audit the Current PWA (DreamHost)
- List all Supabase tables in use (users, progress, journal entries, prayer records)
- Document all API connections (YouVersion Bible API, Resend, OneSignal)
- Map all existing routes and features
- Note any DreamHost-specific configs that need to move

### 1C. Define What Stays vs. What Changes
| Feature | Decision |
|---|---|
| 5 Courses (100X, ID3, The Way, Hindered Hearing, The Bridge) | Rebuild with new style |
| 3D Journal | Keep, move to `/tools` |
| 4D Prayer | Keep, move to `/tools` |
| Community page | Keep, evaluate tab structure |
| Creed Cards | Keep |
| Give page | Keep, embed already works |
| Brochure pages | Pull from existing Next.js build |

---

## Phase 2 — Course Style Guide (Gate Before Building)

**This phase must be completed before any course code is written.**

### What Travis Does
- Open each of the 5 courses in the current app
- Note: what you like, what you don't like, any screens that feel close to right
- Bring notes back — we define the style system from those notes

### What We Define Together
- Lesson card layout
- Session progress UI
- Typography scale for course content
- Scripture block style
- Discussion question component
- Navigation between sessions
- Video embed style (if applicable)

### Deliverable
A course component spec — documented and agreed on — that Claude Code builds to consistently across all 5 courses.

---

## Phase 3 — Architecture Setup

### 3A. Next.js Project Foundation
- Start from the existing brochure Next.js build (don't start over)
- Add PWA configuration: `next-pwa` package, manifest.json, service worker
- Set up Tailwind with ARK brand tokens:
  - Navy: `#143348`
  - Maroon: `#5f0c0b`
  - Gold: `#e8b562`
- Configure Supabase client for Next.js (SSR-safe)
- Set up auth middleware to protect app routes

### 3B. Navigation Design
**Bottom nav (mobile PWA — app users):**
- Courses | Tools | Community | Settings

**Top nav (desktop — public/brochure visitors):**
- About | What We Believe | Give | Vision | Campus

**Note:** The nav should detect context — authenticated app users get app nav, public visitors get brochure nav.

---

## Phase 4 — Course Rebuild

*Requires Phase 2 (style guide) to be complete first.*

### Build Order
1. Course library page (`/courses`) — grid of all 5 courses, public view
2. Course shell component — consistent layout all courses share
3. Session/lesson component — individual lesson view
4. Progress tracking — connect to Supabase (carry over existing logic)
5. Rebuild each course content: 100X → ID3 → The Way → Hindered Hearing → The Bridge

### Course Content Migration
- Source: current PWA course content
- Target: Next.js MDX files or Supabase-stored content (decide during audit)
- Style: apply new style guide consistently

---

## Phase 5 — Tools Integration

### Consolidate Journal + Prayer into `/tools`
- Single page with tab or card navigation: **Journal** | **Prayer**
- Full functionality preserved — just reorganized
- Remove as separate navbar tabs
- Frees up navbar real estate for Courses and Community

### Supabase
- Journal entries table carries over as-is
- Prayer records table carries over as-is
- No data loss — migration only affects UI

---

## Phase 6 — Brochure Integration

*Mostly done — pull from existing Next.js brochure build.*

### Pages to Integrate
- `/about` — mission, origin story, pillars (content already written)
- `/beliefs` — core beliefs + We_Believe.pdf download
- `/give` — existing embedded Square + Global Service Associates forms
- `/vision` — Vision 2026 content, testimonial, team grid
- `/campus` — campus ministry info, meeting times, RSVP

### What's New
- Add DNA as a linked ministry from `/about` and `/vision`
- Settings menu: add links to DNA, campus, give, beliefs

---

## Phase 7 — PWA Configuration

- Install and configure `next-pwa`
- `manifest.json`: app name, icons, theme colors (Navy), display: standalone
- Service worker: offline fallback for courses already visited
- Test install prompt on iOS and Android
- Test desktop PWA install via Chrome

---

## Phase 8 — DNS Cutover & Launch

### Pre-Launch Checklist
- [ ] All 5 courses functional with new style
- [ ] Journal and prayer working in `/tools`
- [ ] Auth working (login, signup, session persistence)
- [ ] Supabase data intact (no lost progress/entries)
- [ ] Brochure pages live and linked correctly
- [ ] Give page embeds tested
- [ ] PWA installable on mobile and desktop
- [ ] Mobile responsive across all pages

### DNS Steps
1. Point `arkidentity.com` from DreamHost to Vercel
2. Verify SSL auto-provisions on Vercel
3. Set up redirects from any old PWA URLs if needed
4. Update all marketing materials (email signatures, social bios, DNA resources)

### Announce
- Email existing app users about the new experience
- Update DNA resources that link to the app
- Update campus ministry materials

---

## What This Is NOT

- Not a DNA feature (journal and prayer are secondary tools here, primary home is DNA)
- Not a blogging platform
- Not a content library — activation and courses only
- Not a separate build from the brochure site — one codebase

---

## Key Decisions Already Made

| Decision | Choice |
|---|---|
| Courses vs. journal/prayer as centerpiece | **Courses** |
| Separate website vs. unified app | **Unified — one Next.js app** |
| Journal + prayer | **Keep, move to /tools** |
| Brochure content | **Fold into app at /about etc.** |
| Hosting | **Vercel — one account, no separation** |
| Starting point | **Existing brochure Next.js build** |
| Course rebuild | **Yes — new style guide first** |

---

## Gate Summary

| Phase | Gate |
|---|---|
| Phase 4 (courses) | Phase 2 (style guide) must be done |
| Phase 8 (launch) | All prior phases complete, checklist cleared |

---

## Immediate Next Steps

1. **Travis:** Go through all 5 courses, take style notes
2. **Travis:** Confirm access to existing Next.js brochure build repo
3. **Claude Code:** Audit brochure build and current PWA (once repo access confirmed)
4. **Travis + Claude:** Define course style guide from notes
5. **Claude Code:** Begin Phase 3 architecture setup
