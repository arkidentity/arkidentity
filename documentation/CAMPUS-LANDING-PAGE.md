# Campus Ministry Landing Page - Implementation Spec
**For Claude Code Build**  
**Date:** January 18, 2025  
**Status:** READY TO BUILD

---

## Project Overview

**URL:** arkidentity.com/campus (or arkidentity.com/iowa - Travis to decide)  
**Purpose:** Single-page landing page for University of Iowa campus ministry recruitment  
**Hosting:** Add to existing arkidentity.com Vercel site  
**Tech:** Next.js page (same stack as main site)

---

## Design Requirements

**Brand Colors (Use existing arkidentity.com theme):**
- Navy: #143348
- Maroon: #5f0c0b
- Gold: #e8b562

**Typography:** Same as arkidentity.com  
**Mobile-first:** Must be fully responsive  
**Layout:** Single-page scroll (no navigation needed beyond main site header)

---

## Page Structure (6 Sections)

### Section 1: HERO

**Headline:** "From Distracted to Devoted"

**Subhead:** "Weekly discipleship gatherings and daily tools to help you follow Jesus through college."

**CTA Button:** "RSVP to Join Us" (smooth scroll to RSVP form section)

**Background:** Full-width hero image (placeholder for now - Travis will provide campus photo later)

**Visual Style:** Same hero treatment as arkidentity.com homepage

---

### Section 2: MEETING TIMES

**Section Headline:** "Join Us at Iowa"

**Three Cards (equal width, responsive stack on mobile):**

**Card 1: Tuesday Nights - Campus Service**
- **Icon/Visual:** Worship/community icon
- **Time:** Tuesdays 8pm
- **Location:** [PLACEHOLDER - Travis will provide before launch]
- **Description:** "Worship, prayer, teaching, community. Our main weekly gathering for all students."

**Card 2: Thursday Nights - Discipleship Groups**
- **Icon/Visual:** Group of people icon
- **Time:** Thursdays 6:30pm
- **Location:** [PLACEHOLDER - Dining hall name - Travis will provide]
- **Description:** "Dinner + small groups of 4. Life-on-life discipleship where you learn to hear God and follow Jesus daily."

**Card 3: Start Your Own Group**
- **Icon/Visual:** Calendar/clock icon
- **Time:** Any day/time that works
- **Location:** Your schedule
- **Description:** "We'll help you gather 3-4 students and give you resources to lead a discipleship group."

**Design Notes:** Same card style as arkidentity.com "What We Offer" section

---

### Section 3: WHAT WE DO

**Section Headline:** "What is ARK Identity?"

**Body Copy (2-3 paragraphs max):**

"ARK Identity equips students to follow Jesus daily through discipleship groups and practical devotional tools. We help you hear God's voice, discover your identity in Christ, and build spiritual habits that actually stick through college and beyond.

We use a discipleship multiplication system called DNA Groups—small groups of 4 students who meet weekly to follow Jesus together. You'll learn to hear God through Scripture journaling, pray together, share life, and grow in your faith. After 6-12 months, you'll be ready to help lead a new group—because disciples make disciples.

Daily, you'll use the ARK app for Scripture journaling (3D Journal), guided prayer (4D Prayer), and theology courses that ground you in who God says you are."

**CTA Link:** "Learn More About ARK" → arkidentity.com/about

**Design:** Simple text block, centered, max-width 800px

---

### Section 4: WHAT TO EXPECT

**Section Headline:** "Your First Meeting"

**Four Steps (numbered or iconified):**

**1. Show Up**  
"[Day/time] at [location - PLACEHOLDER]. Bring yourself (Bible optional, we provide one)."

**2. Meet the Crew**  
"We'll grab food, introduce you around, answer questions. No pressure, no weird rituals."

**3. Experience a Discipleship Group**  
"See how we journal through Scripture, pray together, hear what God's doing in each other's lives."

**4. Decide if You're In**  
"Join a discipleship group, download the ARK app, commit to weekly meetings + daily journaling."

**Design:** 4-column grid on desktop, stack vertically on mobile

---

### Section 5: RSVP FORM

**Section Headline:** "Reserve Your Spot"

**Subhead:** "We'd love to save you a seat. Let us know you're coming."

**Form Fields:**

1. **Full Name**  
   - Type: Text input  
   - Required: Yes  
   - Placeholder: "Your name"

2. **Phone Number**  
   - Type: Tel input  
   - Required: Yes  
   - Placeholder: "(555) 555-5555"

3. **Email**  
   - Type: Email input  
   - Required: Yes  
   - Placeholder: "your@email.com"

4. **Which gathering(s) are you interested in?**  
   - Type: Checkboxes (can select multiple)  
   - Options:
     - ☐ Tuesday Nights (Campus Service)
     - ☐ Thursday Nights (Discipleship Groups)
     - ☐ Start My Own Group

5. **Who are you bringing?**  
   - Type: Text input  
   - Required: No  
   - Placeholder: "Friend's name (optional)"

6. **Questions or Message**  
   - Type: Textarea  
   - Required: No  
   - Placeholder: "Any questions for us? (optional)"

**Submit Button:** "RSVP Now"

---

**Form Functionality (Resend API Integration):**

**On Submit:**
- POST to Resend API
- Send email to: iowa@arkidentity.com
- Email subject: "New Campus RSVP - [Student Name]"
- Email body format:
  ```
  New Campus Ministry RSVP

  Name: [name]
  Phone: [phone]
  Email: [email]
  
  Interested in:
  [checked options]
  
  Bringing: [who they're bringing or "None listed"]
  
  Message: [message or "None"]
  
  Submitted: [timestamp]
  ```

**Success Message:**  
"Thanks! We'll be in touch with details for this week's gathering."

**Error Message:**  
"Something went wrong. Please email iowa@arkidentity.com directly."

**Technical Notes:**
- Use Resend API (Travis has account - will provide API key)
- Store API key as environment variable in Vercel
- No database needed - just email delivery
- Add basic form validation (required fields, email format, phone format)

---

### Section 6: QUICK INFO FOOTER

**Three Columns (stack on mobile):**

**Column 1: What We Believe**
- **Headline:** "What We Believe"
- **Copy:** "We're rooted in historic Christian orthodoxy—Trinitarian, Bible-centered, grace-focused."
- **Link:** "Read Full Statement" → arkidentity.com/beliefs

**Column 2: Leadership**
- **Photo:** [PLACEHOLDER - Travis will provide headshot]
- **Name:** Travis Gluckler
- **Title:** Campus Director
- **Bio:** "Founded ARK Identity in 2013, launching campus ministry at University of Iowa."
- **Link:** "Meet the Team" → arkidentity.com/team

**Column 3: Join Our Team**
- **Headline:** "We're Hiring"
- **Copy:** "2 Campus Coordinator positions open (male + female)"
- **Link:** "View Job Postings" → arkidentity.com/careers

**Design:** 3-column grid on desktop, stack vertically on mobile, light background to differentiate from main content

---

## Technical Implementation

### File Structure

**Add to existing arkidentity.com repo:**
- Create new page: `/pages/campus.js` (or `/pages/iowa.js`)
- Use existing Tailwind config
- Use existing component patterns from homepage

### RSVP Form Integration

**Environment Variable (Vercel):**
- `RESEND_API_KEY` = [Travis will provide]

**API Route (create `/pages/api/campus-rsvp.js`):**
```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, gatherings, bringing, message } = req.body;

  try {
    await resend.emails.send({
      from: 'iowa@arkidentity.com',
      to: 'iowa@arkidentity.com',
      subject: `New Campus RSVP - ${name}`,
      html: `
        <h2>New Campus Ministry RSVP</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Interested in:</strong></p>
        <ul>
          ${gatherings.map(g => `<li>${g}</li>`).join('')}
        </ul>
        <p><strong>Bringing:</strong> ${bringing || 'None listed'}</p>
        <p><strong>Message:</strong> ${message || 'None'}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
```

**Frontend Form Handler:**
- Use fetch() to POST to `/api/campus-rsvp`
- Show loading state while submitting
- Display success/error message
- Clear form on success

---

## Navigation Integration

**Option 1 (Recommended):** Don't add to main nav - just direct-link via arkidentity.com/campus

**Option 2:** Add "Campus Ministry" to main site navigation (under "Get Involved" dropdown?)

**Travis to decide:** Which approach?

---

## Content Placeholders (Travis Will Provide)

**Before Launch:**
1. Meeting locations (Tuesday building/room, Thursday dining hall)
2. Travis headshot photo (for footer section)
3. Hero background image (campus photo)

**Post-Launch (Optional):**
4. Student testimonials (can add section later)
5. Additional campus/group photos
6. Video embed (if you create campus ministry promo video)

---

## Mobile Responsiveness Requirements

- Hero section: Full viewport height on mobile
- Meeting time cards: Stack vertically on mobile
- RSVP form: Full-width on mobile, single column
- Quick info footer: Stack 3 columns vertically on mobile
- All text readable without zoom
- Large tap targets for buttons (min 44px height)
- Smooth scroll behavior for "RSVP" button

---

## Page Length Estimate

**Desktop viewport heights:**
- Hero: 100vh (full screen)
- Meeting Times: ~600px
- What We Do: ~400px
- What to Expect: ~500px
- RSVP Form: ~600px
- Quick Info Footer: ~400px

**Total:** ~2500px scroll = Clean, digestible single-page experience

---

## SEO Requirements

**Meta Tags:**
- Title: "Campus Ministry at University of Iowa | ARK Identity"
- Description: "Join weekly discipleship gatherings at U of Iowa. Learn to hear God's voice, follow Jesus daily, and make disciples through ARK Identity's campus ministry."
- Keywords: University of Iowa, campus ministry, discipleship, college students, Iowa City, Christian student groups

**Open Graph (for social sharing):**
- og:title: "ARK Identity Campus Ministry - University of Iowa"
- og:description: "Weekly discipleship gatherings and daily tools to help you follow Jesus through college."
- og:image: [Campus photo when available]
- og:url: https://arkidentity.com/campus

---

## Deployment Checklist

- [ ] Build page at arkidentity.com/campus (or /iowa)
- [ ] Create RSVP form API route
- [ ] Add Resend API key to Vercel environment variables
- [ ] Test form submission (verify email delivery to iowa@arkidentity.com)
- [ ] Add meeting location placeholders (Travis will update before launch)
- [ ] Add Travis photo placeholder (Travis will provide)
- [ ] Add hero image placeholder (Travis will provide)
- [ ] Test mobile responsiveness
- [ ] Verify all links work (to /about, /beliefs, /team, /careers)
- [ ] Deploy to production

---

## Post-Launch Updates

**Easy Updates (Travis can do via Vercel dashboard or Git):**
- Meeting locations (as they change)
- Schedule updates
- Add student testimonials section
- Upload better photos

**Future Enhancements (Optional):**
- Video testimonials
- Photo gallery from events
- Event calendar integration
- Student login (if needed later)

---

## Success Metrics

**Track via Google Analytics (if enabled):**
- Page views
- RSVP form submissions
- Bounce rate
- Time on page
- Mobile vs desktop traffic

**Manual Tracking:**
- How many RSVPs per week
- Which gatherings students choose (Tuesday vs Thursday vs Start Own)
- Conversion rate (page visits → RSVPs)

---

## Final Notes

**This is a lean, focused landing page:**
- Single purpose: Get students to RSVP
- No fluff, no unnecessary sections
- Links to main site for deep dives
- Fast to build, easy to maintain

**Future expansion:**
- Can add testimonials section later
- Can add photo gallery later
- Can add video embed later
- Start simple, add as ministry grows

---

**Ready for Claude Code to build.**

---

## Content Approval Status

**Approved by Travis:**
✅ Page structure (6 sections)  
✅ Headline: "From Distracted to Devoted"  
✅ Meeting times (Tuesdays 8pm, Thursdays 6:30pm, Start Your Own)  
✅ RSVP form fields (name, phone, email, gatherings, bringing, message)  
✅ What We Do copy (DNA Groups + ARK app tools)  
✅ What to Expect (4-step first visit)  
✅ Quick info footer (beliefs, leadership, hiring links)  

**Pending from Travis:**
- Meeting locations (Tuesday building, Thursday dining hall)
- Travis headshot photo
- Hero background image (campus photo)
- Resend API key (for form submission)

---

**END OF SPEC**
