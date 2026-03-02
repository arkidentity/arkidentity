# Hero Image Specifications for /iowa Page

## Required Image Specs

**Dimensions:**
- Minimum width: 1920px
- Minimum height: 1080px
- Aspect ratio: 16:9 (landscape)
- Recommended: 2560px × 1440px for high-resolution displays

**File Format:**
- JPG (recommended for photos)
- WebP (optional, for better compression)

**File Size:**
- Target: Under 500KB
- Maximum: 1MB

**Placement:**
- File location: `/public/images/iowa-hero.jpg`
- The image will be used as a full-screen background on the hero section

## Content Guidelines

**Subject Matter:**
- University of Iowa campus scenes
- Student life, gatherings, or campus buildings
- Iowa City landmarks

**Composition:**
- Center area should be relatively clear for text overlay
- Dark or vibrant areas work best (will have 40% dark overlay)
- Avoid busy/cluttered center composition

**Color/Tone:**
- Natural lighting preferred
- Warm tones work well with gold CTA button
- Image will have a dark overlay applied (40% opacity black)

## Implementation

Once you provide the image, place it at:
```
/public/images/iowa-hero.jpg
```

Then update `/app/iowa/page-content.tsx` line 82:
```tsx
<div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
```

Change to:
```tsx
<div className="absolute inset-0">
  <Image
    src="/images/iowa-hero.jpg"
    alt="University of Iowa Campus"
    fill
    className="object-cover"
    priority
  />
</div>
```

## Current Placeholder

Currently using a gradient background as placeholder until you provide the hero image.
