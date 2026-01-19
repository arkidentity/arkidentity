# Next Steps for Travis

**Website Built:** January 18, 2025
**Status:** ✅ Complete and ready for deployment

---

## ✅ What's Done

- [x] All 7 pages built and working
- [x] Mobile responsive design (hybrid style: clean + bold)
- [x] Brand colors configured (#143348 navy, #5f0c0b maroon, #e8b562 gold)
- [x] Navigation with "Giving" as top-level link
- [x] Embedded donation forms (Square + Global Service Associates)
- [x] Placeholder images with proper aspect ratios
- [x] SEO metadata on all pages
- [x] Build tested successfully (no errors)

---

## 📋 What You Need to Provide

### 1. Images (High Priority)

Place these in `/public/images/`:

- [ ] **App screenshot or demo video** (MP4) - for homepage hero (right side)
  - Aspect ratio: Square (1:1) or vertical (4:3)
  - Suggested size: 800x800px or larger

- [ ] **DNA logo** - for "For Churches" card on homepage
  - Format: PNG or SVG
  - Transparent background preferred

- [ ] **U of Iowa campus ministry photos** (2-3 options)
  - For campus callout section background
  - Horizontal/landscape orientation
  - High resolution (1920x1080px or larger)

- [ ] **Team photos**
  - Travis headshot (square, 500x500px or larger)
  - Kimberly headshot (square, 500x500px or larger)

- [ ] **ARK Identity logo**
  - SVG preferred (scales perfectly)
  - PNG acceptable (high res, transparent background)

### 2. Content Updates

- [ ] **Advisory Board** (4 people)
  - Name
  - Role/Church/Expertise
  - Update in: `app/team/page.tsx` (lines 50-75)

- [ ] **Volunteer Leaders** (10 people with locations)
  - Name + Location (e.g., "Sy Ruiz - Aurora/Denver, CO")
  - Update in: `app/team/page.tsx` (lines 90-150)
  - Also update in: `app/vision-2026/page.tsx` (team grid section)

- [ ] **We_Believe.pdf**
  - Place in `/public/` folder
  - Update link in: `app/beliefs/page.tsx` (line ~90)

### 3. YouTube Videos

- [ ] **Vision 2026 video URL**
  - Get YouTube video ID from URL (`youtu.be/FFMX4J9mGVY` → ID is `FFMX4J9mGVY`) 
  - Update in: `app/vision-2026/page.tsx` (line ~40)

- [ ] **Cross Culture Church testimony video URL**
Youtube video ID youtu.be/njMFpy2vEgE
  - Update in: `app/vision-2026/page.tsx` (line ~150)

### 4. Links

- [ ] **Social media URLs**
  - YouTube channel
  - Instagram profile
  - Facebook page
  - Update in: `components/Footer.tsx` (lines 80-100)

- [ ] **Handshake profile URL** (optional)
  - Update in: `app/get-involved/page.tsx` (if available)

---

## 🚀 How to Deploy

### Option A: Via Vercel Dashboard (Easiest)

1. Create a GitHub repository
2. Push this code to GitHub:
   ```bash
   cd arkidentity-website
   git init
   git add .
   git commit -m "Initial ARK Identity website build"
   git remote add origin https://github.com/YOUR_USERNAME/arkidentity-website.git
   git push -u origin main
   ```

3. Go to [vercel.com](https://vercel.com) and sign up/login
4. Click "Import Project"
5. Select your GitHub repo
6. Click "Deploy" (Vercel auto-detects Next.js)
7. After deployment, add custom domain:
   - Go to Project Settings → Domains
   - Add `arkidentity.com`
   - Follow DNS instructions Vercel provides

### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 🔧 How to Make Updates After Deployment

### Updating Images:

1. Add image to `/public/images/`
2. Update the file path in the relevant page
3. Example (homepage hero):
   ```tsx
   // In app/page.tsx, replace the placeholder with:
   <Image
     src="/images/app-demo.png"
     alt="ARK App Demo"
     width={800}
     height={800}
     className="rounded-2xl"
   />
   ```

### Updating YouTube Videos:

1. Get video ID from YouTube URL
   - Example: `youtube.com/watch?v=dQw4w9WgXcQ` → ID is `dQw4w9WgXcQ`

2. Replace placeholder in `app/vision-2026/page.tsx`:
   ```tsx
   <iframe
     className="w-full aspect-video rounded-xl"
     src="https://www.youtube.com/embed/dQw4w9WgXcQ"
     title="Vision 2026 Video"
     frameBorder="0"
     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
     allowFullScreen
   />
   ```

### Updating Team/Volunteer Lists:

Open the relevant file and find the placeholder section:
- Team page: `app/team/page.tsx`
- Vision 2026 team grid: `app/vision-2026/page.tsx`

Replace placeholder text with actual names and locations.

---

## 🧪 Testing Before Launch

### Local Testing:
```bash
npm run dev
```
Open http://localhost:3000 and check:
- [ ] All pages load
- [ ] Navigation works
- [ ] External links open in new tabs
- [ ] Donation forms load properly
- [ ] Mobile responsive (resize browser window)

### Production Build Test:
```bash
npm run build
npm start
```

---

## 📞 Need Help?

If you encounter issues:
1. Check the README.md for detailed instructions
2. Email: thearkidentity@gmail.com
3. Common issues:
   - **Image not showing:** Check file path and extension
   - **Build error:** Check console for specific error message
   - **Deployment failed:** Verify GitHub repo is connected to Vercel

---

## 🎨 Design Notes

The site uses a **hybrid design approach**:
- **Clean sections:** Homepage hero, mission pillars, team page
- **Bold sections:** Campus callout (navy background), Vision 2026 gradient
- **Cards:** Shadow + hover effects for product cards

You can adjust colors in `app/globals.css` (lines 7-13) if needed.

---

## ✨ What Makes This Site Special

1. **Fast:** Static generation = instant page loads
2. **SEO:** Proper metadata on every page for Google
3. **Mobile-first:** Looks great on phone, tablet, desktop
4. **Conversion-focused:** Clear CTAs directing to app + DNA
5. **Donor-ready:** Vision 2026 page tells compelling story
6. **Professional:** Clean, modern design that will last years

---

**You're all set! Once you add your images and content, deploy to Vercel and go live.** 🚀
