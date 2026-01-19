# CLAUDE CODE BUILD INSTRUCTIONS
**Project:** arkidentity.com website  
**Date:** January 18, 2025

---

## What to Build

**A 6-page Next.js website hosted on Vercel (free tier)**

### Pages:
1. Home
2. About
3. Team
4. What We Believe
5. Get Involved (Giving/Careers/Partnerships)
6. Vision 2026

### Key Requirements:
- Mobile-responsive (Tailwind CSS)
- Fast load times
- Clean, modern design
- Two embedded donation forms (Square + Global Service Associates)
- YouTube video embeds
- Placeholder images for team photos

---

## File Structure

```
arkidentity-website/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── public/
│   ├── images/
│   │   ├── logo.svg (ARK Identity logo)
│   │   ├── app-screenshot.png (placeholder)
│   │   ├── dna-group.png (placeholder)
│   │   └── campus-students.png (placeholder)
│   └── We_Believe.pdf (Travis will provide)
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js (Home)
│   │   ├── about/
│   │   │   └── page.js
│   │   ├── team/
│   │   │   └── page.js
│   │   ├── beliefs/
│   │   │   └── page.js
│   │   ├── give/
│   │   │   └── page.js
│   │   └── vision-2026/
│   │       └── page.js
│   └── components/
│       ├── Header.js
│       ├── Footer.js
│       ├── ProductCard.js
│       └── TeamMember.js
```

---

## Brand Colors

```css
:root {
  --navy: #143348;
  --maroon: #5f0c0b;
  --gold: #e8b562;
  --head-blue: #1E90FF; /* Information */
  --heart-red: #8B0000; /* Transformation */
  --hands-gold: #e8b562; /* Activation */
}
```

---

## Critical Design Elements

### Homepage Hero
- **Headline:** "Discipleship Tools That Naturally Multiply"
- **Subhead:** "We help believers experience God daily and churches multiply disciples naturally."
- **Two equal CTAs:**
  - Button: "For Individuals" → https://app.arkidentity.com
  - Button: "For Churches" → https://dna.arkidentity.com

### What We Offer (2 Cards)
**Card 1: Daily Discipleship Tools**
- Link to: https://app.arkidentity.com

**Card 2: DNA Multiplication System**
- Link to: https://dna.arkidentity.com

### Campus Callout (Below Cards)
- Smaller section, different background color
- Headline: "Proving the Model on Campus"
- Link to: https://campus.arkidentity.com (or /about#campus)

---

## Team Page Structure

### Section 1: Leadership (With Photos)
```html
<h2>Leadership</h2>
<div class="grid grid-cols-2">
  <div>
    <img src="/images/travis-placeholder.jpg" alt="Travis Gluckler">
    <h3>Travis Gluckler</h3>
    <p>Founder & National Director</p>
  </div>
  <div>
    <img src="/images/kimberly-placeholder.jpg" alt="Kimberly Gluckler">
    <h3>Kimberly Gluckler</h3>
    <p>Network Administrator</p>
  </div>
</div>
```

### Section 2: Advisory Board (Names Only)
```html
<h2>Advisory Board</h2>
<ul>
  <li><strong>[Name Placeholder 1]</strong> - [Role Placeholder]</li>
  <li><strong>[Name Placeholder 2]</strong> - [Role Placeholder]</li>
  <li><strong>[Name Placeholder 3]</strong> - [Role Placeholder]</li>
  <li><strong>[Name Placeholder 4]</strong> - [Role Placeholder]</li>
</ul>
```

### Section 3: Volunteer Leaders (Simple List)
```html
<h2>Volunteer Leaders</h2>
<ul>
  <li>Sy Ruiz - Aurora/Denver, CO</li>
  <li>Leah Jennings - Las Vegas, NV</li>
  <!-- etc. - Travis will provide full list -->
</ul>
```

---

## Vision 2026 Team Grid

**Headline:** "2 Full-Time Leaders. 13 Volunteers. Imagine 100."

**Layout:**
```html
<!-- Full-Time Leaders (Highlighted Background) -->
<div class="full-time-team bg-gold">
  <div>Travis Gluckler - Iowa City, IA</div>
  <div>Kimberly Gluckler - Iowa City, IA</div>
</div>

<!-- Volunteer Leaders (Standard Grid) -->
<div class="volunteer-grid">
  <div>Sy Ruiz - Aurora/Denver, CO</div>
  <div>Leah Jennings - Las Vegas, NV</div>
  <!-- etc. - 13 total -->
</div>
```

---

## Giving Page Embeds

### Option 1: Square Checkout
```html
<iframe 
  src="https://3d.arkidentity.com/product/partnership/55?cs=true&cst=custom"
  width="100%"
  height="600px"
  frameborder="0">
</iframe>
```

### Option 2: Global Service Associates
```html
<iframe
  src="https://app.arkidentity.com/#give"
  width="100%"
  height="600px"
  frameborder="0">
</iframe>
```

---

## YouTube Video Embeds (Vision 2026 Page)

```html
<!-- Vision 2026 Video -->
<iframe 
  width="100%" 
  height="480" 
  src="https://www.youtube.com/embed/[VIDEO_ID_PLACEHOLDER]"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>

<!-- Cross Culture Testimony Video -->
<iframe 
  width="100%" 
  height="480" 
  src="https://www.youtube.com/embed/[VIDEO_ID_PLACEHOLDER]"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>
```

---

## Navigation

**Header Links:**
- About
- Team
- What We Believe
- Get Involved (dropdown: Giving, Careers)
- Vision 2026

**Footer Links:**
- About, Team, What We Believe, Giving, Careers, Vision 2026
- Products: App, DNA, Campus
- Social icons: YouTube, Instagram, Facebook
- Email: thearkidentity@gmail.com
- Copyright © 2025 ARK Identity

---

## Deployment

1. Build Next.js app locally
2. Push to GitHub repo (create new repo: `arkidentity-website`)
3. Connect to Vercel (import from GitHub)
4. Set custom domain: arkidentity.com
5. Deploy (Vercel auto-provisions SSL)

---

## Testing Checklist

- [ ] All 6 pages load correctly
- [ ] Navigation works on all pages
- [ ] External links open in new tab (app, DNA, campus)
- [ ] Embedded donation forms load properly
- [ ] YouTube videos play
- [ ] Mobile responsive (test on phone simulator)
- [ ] Footer displays correctly
- [ ] Brand colors match spec

---

## Placeholder Content

**Use these placeholders until Travis provides:**
- Team photos: Gray boxes with "Photo Coming Soon"
- Advisory Board: "[Name] - [Role/Title]"
- YouTube videos: "[Video Coming Soon]" with gray box
- We_Believe.pdf: Link displays but file not present yet

---

## Questions for Travis (After Build)

1. Team photos (Travis + Kimberly headshots)
2. Advisory Board names/roles (4 people)
3. Updated volunteer leader list (13 names + locations)
4. We_Believe.pdf file
5. YouTube video URLs (Vision 2026 + Cross Culture)
6. Handshake profile URL (if available)
7. Google Analytics tracking ID (if desired)

---

**Reference Files:**
- Full content: `/arkidentity-com-content-UPDATED.md`
- Summary: `/HANDOFF-SUMMARY-UPDATED.md`

---

**END OF BUILD INSTRUCTIONS**
