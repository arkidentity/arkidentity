# ARK Identity Website

Official website for ARK Identity - Discipleship tools that naturally multiply.

**Built:** January 18, 2025
**Tech Stack:** Next.js 16, Tailwind CSS, TypeScript
**Domain:** arkidentity.com

---

## Project Overview

This is the brand hub website for ARK Identity, directing audiences to our two main products (ARK App and DNA System) with campus ministry as an emerging third pillar.

### Pages:
1. **Home** - Hero with dual CTAs, product cards, campus callout, mission, Vision 2026 link
2. **About** - Mission, origin story, three-fold mission
3. **Team** - Leadership photos, Advisory Board, Volunteer Leaders
4. **What We Believe** - Core beliefs + PDF download
5. **Giving** - Two embedded donation forms (Square + Global Service Associates)
6. **Get Involved** - Careers + Ministry Partnerships
7. **Vision 2026** - Goals, testimonials, team grid, donor CTAs

---

## Brand Colors

```css
Navy: #143348
Maroon: #5f0c0b
Gold: #e8b562
Head Blue: #1E90FF (Information)
Heart Red: #8B0000 (Transformation)
Hands Gold: #e8b562 (Activation)
```

---

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build for Production

```bash
npm run build
npm start
```

---

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repo
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"
7. Add custom domain: `arkidentity.com` in Project Settings → Domains

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### DNS Configuration

After deploying, update your domain DNS records:

1. In your domain registrar (where you bought arkidentity.com):
   - Add A record: `76.76.21.21`
   - Add CNAME record: `www` → `cname.vercel-dns.com`

2. In Vercel dashboard:
   - Go to Project Settings → Domains
   - Add `arkidentity.com` and `www.arkidentity.com`
   - Vercel will auto-provision SSL

---

## What Still Needs to Be Done

### Assets to Replace (Travis to Provide):

1. **Images:**
   - App screenshots or demo video (MP4) for homepage hero
   - DNA logo for "For Churches" card
   - U of Iowa campus ministry photos (2-3 options)
   - Team photos: Travis + Kimberly headshots
   - ARK Identity logo (SVG preferred)

2. **Content:**
   - Advisory Board names + roles (4 people)
   - Updated volunteer leader list with names + locations (10 people)
   - We_Believe.pdf file (place in `/public` folder)
   - YouTube video URLs:
     - Vision 2026 video
     - Cross Culture Church testimony

3. **Links:**
   - Handshake profile URL (if available for careers page)
   - Social media URLs (YouTube, Instagram, Facebook)

### How to Add Images:

1. Place images in `/public/images/` folder
2. Update file paths in respective page files:
   - Homepage hero: `app/page.tsx` (line ~45)
   - Product cards: `app/page.tsx` (lines ~65, ~90)
   - Team photos: `app/team/page.tsx`

### How to Add YouTube Videos:

Replace placeholders in `/app/vision-2026/page.tsx`:

```tsx
// Replace this:
<div className="aspect-video bg-gray-800...">
  <!-- Placeholder -->
</div>

// With this:
<iframe
  width="100%"
  height="480"
  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

---

## Project Structure

```
arkidentity-website/
├── app/
│   ├── layout.tsx          # Root layout with Header/Footer
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Global styles + brand colors
│   ├── about/page.tsx
│   ├── team/page.tsx
│   ├── beliefs/page.tsx
│   ├── giving/page.tsx
│   ├── get-involved/page.tsx
│   └── vision-2026/page.tsx
├── components/
│   ├── Header.tsx          # Navigation
│   └── Footer.tsx          # Footer with links
├── public/
│   └── images/             # Place your images here
└── package.json
```

---

## Key Features

- **Hybrid Design:** Clean modern sections with bold visual storytelling
- **Mobile Responsive:** All pages optimized for mobile, tablet, desktop
- **Fast Loading:** Static generation for optimal performance
- **Embedded Forms:** Square checkout + Global Service Associates donation forms
- **SEO Optimized:** Proper metadata on every page
- **Accessible:** Semantic HTML, ARIA labels, keyboard navigation

---

## Support

For questions about this website build:
- **Email:** thearkidentity@gmail.com

---

**Built with ❤️ by Claude Code**
