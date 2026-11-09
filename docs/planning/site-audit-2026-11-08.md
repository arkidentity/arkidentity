# arkidentity.com: human-made-sites audit (11/8)

Machine audit (`audit.js`, run on the live pages at 1280px) plus a visual check of the main pages. A score is the number of AI-template tells. Target 0; ship at 1 or less.

## Scores (worst first)
| Page | Score | Tells |
|---|---|---|
| /about | 7 | Arial, centered hero, "OUR STORY" eyebrow, 12 identical shadow cards, number circles, "journey" |
| /feed | 7 | Arial, centered hero, "FROM THE FIELD" eyebrow, 9 caps labels, 8 identical cards, "empowers/transformed" |
| /iowa | 6 | Arial, centered hero on a plain dark block (no photo), 10 middle dots, 8 em dashes, number circles |
| /team | 6 | Arial, centered hero, "OUR PEOPLE" eyebrow, 18 identical cards, "transformation" |
| /vision-2026 | 6 | Arial, centered hero, "OUR FUTURE" eyebrow, 13 identical cards, "empowers" |
| /beliefs | 5 | Arial, centered hero, "OUR FOUNDATION" eyebrow, 9 identical cards |
| /iowa/trick-or-truth | 5 | Arial, centered hero, eyebrow, 8 caps labels (seasonal, done for 2026) |
| /get-involved | 4 | Arial, centered hero, "JOIN THE MISSION" eyebrow, "transformation" |
| /creed-cards (ark site) | 4 | Arial, 6 caps labels, middle dots, gradients |
| /iowa/studies | 4 | Arial, eyebrow, caps labels, 6 middle dots |
| / and /courses | 3 | Arial, 8 gradients, shadow cards. This is the course app, not a landing page. |
| /giving | 3 | Arial, centered hero, "PARTNER WITH US" eyebrow |
| /friday | 3 | Arial, centered hero, a middle dot |
| /resources | 2 | Arial, caps labels |
| /iowa/truth, /pray, /training | 1 | Arial only |
| **/iowa/baja** | **0** | Redesigned 11/8 |

## What the visual check adds
1. **Seven pages share one copied template:** about, beliefs, giving, team, vision-2026, get-involved and feed. Each has a navy hero, a small gold all-caps eyebrow ("Our Story", "Our People"…), a centered headline, a short gold bar under it, then cream sections of white rounded cards with a **gold left border** (also a tell). The template is copied into each page, not shared, so it's 7 edits, not 1.
2. **The eyebrows repeat the page name** ("Our People" over "Meet the Team"), which also breaks the no-redundant-eyebrow rule.
3. **No real photos on most pages.** The hero is a flat navy block. ARK has real material (Iowa tables, Baja builds, the team, partner churches) that isn't used.
4. **Arial everywhere** (the starter-code bug in `globals.css` line 91). It's the one fix that touches every page.

## Recommended order
1. **Pick the ARK site's type once** (a site-wide change, needs Travis's yes). Fixing `globals.css` changes every page together, so the site stays consistent.
2. **Redo the shared template** with a real photo hero, no eyebrow, headline left with the button right, and varied sections instead of left-border cards. Start with **/giving** and **/about** (donors and partners land there), then team, vision, beliefs, get-involved.
3. **/iowa** next: it's the student front door. It needs a real photo of a table of four and the dates and middle dots cleaned up.
4. **Feed**, **studies**, **resources** after that. The course app (/) follows app rules, not this skill.
