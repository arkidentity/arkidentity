# Iowa Campus Landing Page - Deployment Notes

## What Was Built

✅ Complete `/iowa` landing page with all 6 sections:
1. **Hero Section** - "From Distracted to Devoted" with RSVP CTA
2. **Meeting Times** - 3 cards (Tuesday nights, Thursday nights, Start Your Own)
3. **What We Do** - ARK Identity overview with DNA Groups explanation
4. **What to Expect** - 4-step first visit walkthrough
5. **RSVP Form** - Full form with Resend API integration
6. **Quick Info Footer** - Beliefs, Leadership (with your photo), Hiring

## Files Created/Modified

### New Files
- `/app/iowa/page.tsx` - Page metadata and wrapper
- `/app/iowa/page-content.tsx` - Main page component (client-side)
- `/app/api/campus-rsvp/route.ts` - API endpoint for form submissions
- `/documentation/IOWA-HERO-IMAGE-SPECS.md` - Specs for hero background image

### Modified Files
- `/package.json` - Added `resend@^4.0.1` dependency

## Meeting Details Implemented

**Tuesday Nights:**
- Time: Tuesdays 7:30pm
- Location: Geneva at Old Brick, 26 E Market St. (Entrance off Clinton St.)

**Thursday Nights:**
- Time: Thursdays 6:30pm
- Location: Burge Dining Hall (RSVP for more info)

**Start Your Own Group:**
- Time: Any day/time that works
- Location: Your schedule

## Before Going Live

### 1. Add Resend API Key to Vercel
Navigate to your Vercel project settings and add:
- **Key:** `RESEND_API_KEY`
- **Value:** Your Resend API key

### 2. Verify Email Domain
Ensure `iowa@arkidentity.com` is verified in your Resend account to send/receive emails.

### 3. Add Hero Background Image (Optional)
See `/documentation/IOWA-HERO-IMAGE-SPECS.md` for image specifications.
- Recommended size: 2560px × 1440px
- Place at: `/public/images/iowa-hero.jpg`
- Currently using gradient placeholder

## Deployment Steps

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Test Build Locally:**
   ```bash
   npm run build
   ```

3. **Test Dev Server (Optional):**
   ```bash
   npm run dev
   ```
   Visit: http://localhost:3000/iowa

4. **Commit and Push to Git:**
   ```bash
   git add .
   git commit -m "Add Iowa campus landing page with RSVP form"
   git push
   ```

5. **Add Environment Variable in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `RESEND_API_KEY` with your Resend API key
   - Save

6. **Deploy:**
   - Vercel will auto-deploy from your git push
   - Or manually trigger deployment in Vercel dashboard

## Testing the Page

### Before Launch
1. **Visit the page:** arkidentity.com/iowa
2. **Test RSVP form submission:**
   - Fill out all required fields
   - Submit form
   - Check that email arrives at iowa@arkidentity.com
3. **Test mobile responsiveness:**
   - View on phone/tablet
   - Verify all sections stack properly
   - Ensure form is usable on mobile

### Form Validation
- Name, Phone, Email are required
- At least one gathering must be selected
- Email format validation
- Phone field accepts any format (no strict validation)

## Page Features

### Responsive Design
- Mobile-first approach
- Cards stack vertically on mobile
- Hero section is full viewport height
- Form is single-column on mobile
- Navigation inherited from main site

### SEO
- Meta title: "Campus Ministry at University of Iowa | ARK Identity"
- Meta description optimized for search
- OpenGraph tags for social sharing
- Keywords: University of Iowa, campus ministry, discipleship, etc.

### Smooth Scroll
- "RSVP to Join Us" button smoothly scrolls to form section
- Improves user experience on single-page layout

### Form Handling
- Client-side validation
- Loading state during submission
- Success/error messages
- Form clears on successful submission
- Emails include timestamp, all form fields, and formatting

## Email Format

When someone submits an RSVP, you'll receive an email with:
- Subject: "New Campus RSVP - [Student Name]"
- Body includes:
  - Name
  - Phone
  - Email
  - Which gatherings they're interested in
  - Who they're bringing (optional)
  - Message/questions (optional)
  - Timestamp (Central Time)

## Future Enhancements (Optional)

From the spec, these are "nice to have" additions:
- Student testimonials section
- Photo gallery from events
- Video testimonials
- Event calendar integration
- Better hero background image (once you provide it)

## Support

If you need to:
- **Update meeting times/locations:** Edit `/app/iowa/page-content.tsx`
- **Change form fields:** Edit `/app/iowa/page-content.tsx` (form section)
- **Update email recipient:** Edit `/app/api/campus-rsvp/route.ts`
- **Add hero image:** See `/documentation/IOWA-HERO-IMAGE-SPECS.md`

## Links from Page

The page links to these existing pages:
- `/about` - Learn More About ARK button
- `/beliefs` - What We Believe footer link
- `/team` - Meet the Team footer link
- `/get-involved` - View Job Postings footer link

All links were verified to exist in your current site structure.

---

**Status:** ✅ Ready to deploy
**Build Test:** ✅ Passed
**Dependencies:** ✅ Installed (resend@^4.0.1)
**Pending:** Add RESEND_API_KEY to Vercel environment variables
