// ============================================
// Guided Activations — 4D Prayer Feature
// Pre-built 20-minute guided experiences
// adapted from the 90-Day Toolkit (Month 3)
// ============================================

import type { CardType, PrayerSession, SessionCard } from './prayerData';

// ============================================
// TYPES
// ============================================

export interface ActivationCard {
  type: CardType;
  content: string;
  subPrompt: string;
  scripture: string | null;
  scriptureRef: string | null;
  duration: number;           // seconds this card occupies
  allowSkip: boolean;
  extendedSilence?: boolean;  // shows breathing indicator on LISTEN/RESPOND cards
}

export interface GuidedActivation {
  id: string;
  week: number;               // DNA Pathway week number
  title: string;
  subtitle: string;
  description: string;        // Short teaser shown on dashboard
  durationMinutes: number;
  totalDuration: number;      // Must equal sum of card durations
  cards: ActivationCard[];
}

// ============================================
// SESSION BUILDER
// ============================================

export function buildActivationSession(activation: GuidedActivation): PrayerSession {
  const typeCounts: Partial<Record<CardType, number>> = {};
  activation.cards.forEach(c => {
    typeCounts[c.type] = (typeCounts[c.type] ?? 0) + 1;
  });

  const typeIndexes: Partial<Record<CardType, number>> = {};

  const sessionCards: SessionCard[] = activation.cards.map((card) => {
    typeIndexes[card.type] = (typeIndexes[card.type] ?? 0) + 1;
    return {
      type: card.type,
      content: card.content,
      scripture: card.scripture,
      scriptureRef: card.scriptureRef ?? null,
      subPrompt: card.subPrompt,
      duration: card.duration,
      allowSkip: card.allowSkip,
      cardNumber: typeIndexes[card.type]!,
      totalOfType: typeCounts[card.type]!,
      isUserCard: false,
      extendedSilence: card.extendedSilence ?? false,
    };
  });

  return {
    type: 'activation',
    duration: activation.durationMinutes,
    totalDuration: activation.totalDuration,
    cards: sessionCards,
  };
}

// ============================================
// ACTIVATION 1: BREAKING STRONGHOLDS (WEEK 9)
// Reveal · Renounce · Replace
// 14 cards — 1200 seconds / 20 minutes
// ============================================

export const breakingStrongholdsActivation: GuidedActivation = {
  id: 'breaking-strongholds',
  week: 9,
  title: 'Reveal, Renounce, Replace',
  subtitle: 'Breaking Strongholds',
  description:
    "A Spirit-led 20-minute exercise to identify a lie you've been believing, break agreement with it, and replace it with God's truth. Grab your journal.",
  durationMinutes: 20,
  totalDuration: 1200,
  cards: [

    // ── 1 · INTRO · 40s ──────────────────────────────────
    {
      type: 'INTRO',
      content: 'Welcome to Reveal Renounce Replace',
      subPrompt:
        "Find a quiet place. Grab your journal and a pen. You're about to do some of the most important spiritual work you've done. God right here with you.",
      scripture: null,
      scriptureRef: null,
      duration: 40,
      allowSkip: false,
    },

    // ── 2 · TEACH · 50s ──────────────────────────────────
    {
      type: 'TEACH',
      content: 'What Is a Stronghold?',
      subPrompt:
        "A stronghold is a lie you've believed so long it feels like truth. It shapes how you see yourself, how you relate to God, and what you think you deserve. It isn't loud — it's just always there.",
      scripture: null,
      scriptureRef: null,
      duration: 50,
      allowSkip: true,
    },

    // ── 3 · TEACH · 55s ──────────────────────────────────
    {
      type: 'TEACH',
      content: 'Three Steps: Reveal · Renounce · Replace',
      subPrompt:
        "God reveals the lie. You speak it out and reject it. God replaces it with truth. Each step matters — don't skip ahead. This is a process, not a formula. Follow His lead.",
      scripture: null,
      scriptureRef: null,
      duration: 55,
      allowSkip: true,
    },

    // ── 4 · TEACH · 65s ──────────────────────────────────
    {
      type: 'TEACH',
      content: 'Why Replace Matters',
      subPrompt:
        "Jesus is clear: driving out darkness is not enough. An empty house invites something worse. When we remove a lie, we must fill that space with His truth — or we become more vulnerable, not less.",
      scripture:
        'When an impure spirit comes out of a person… it finds the house swept clean and put in order. Then it goes and takes seven other spirits more wicked than itself, and they go in and live there.',
      scriptureRef: 'Matthew 12:43–45',
      duration: 65,
      allowSkip: true,
    },

    // ── 5 · LISTEN · 65s ─────────────────────────────────
    {
      type: 'LISTEN',
      content: 'Step 1 — Reveal',
      subPrompt:
        "Ask God this out loud or in your heart: \"Is there a lie I've been believing about God, myself or even someone else?\" Then wait. Don't filter it. Don't argue with what surfaces. Write it down.",
      scripture: null,
      scriptureRef: null,
      duration: 65,
      allowSkip: true,
      extendedSilence: false,
    },

    // ── 6 · RESPOND · 130s ───────────────────────────────
    {
      type: 'RESPOND',
      content: 'Listen. Write What He Shows You.',
      subPrompt:
        "Take your time. Write a word, a sentence, a memory — whatever surfaces. Don't judge what comes. This is a safe space between you and God. He sees the root. Let Him show you.",
      scripture: null,
      scriptureRef: null,
      duration: 130,
      allowSkip: true,
      extendedSilence: true,
    },

    // ── 7 · LISTEN · 140s ────────────────────────────────
    {
      type: 'LISTEN',
      content: "Go Deeper If He's Still Speaking",
      subPrompt:
        'Ask Him: "How long have I believed this? Where did it come from?" Let Him trace the root. Don\'t rush. Write anything He shows you.',
      scripture: null,
      scriptureRef: null,
      duration: 140,
      allowSkip: true,
      extendedSilence: true,
    },

    // ── 8 · DECLARE · 60s ────────────────────────────────
    {
      type: 'DECLARE',
      content: 'Step 2 — Renounce',
      subPrompt:
        "This step must be spoken out loud. Your voice carries authority here. You are not just thinking different thoughts — you are breaking an agreement. When you're ready, read the next card aloud.",
      scripture: null,
      scriptureRef: null,
      duration: 60,
      allowSkip: true,
    },

    // ── 9 · DECLARE · 105s ───────────────────────────────
    {
      type: 'DECLARE',
      content: 'Speak This Aloud — Fill In the Blank',
      subPrompt:
        '"In the name of Jesus, I renounce the lie that [the lie God revealed]. I break agreement with it right now. I choose to no longer give it power over my mind, my heart, or my identity. It has no hold on me. I am free."',
      scripture: null,
      scriptureRef: null,
      duration: 105,
      allowSkip: true,
    },

    // ── 10 · LISTEN · 60s ────────────────────────────────
    {
      type: 'LISTEN',
      content: 'Step 3 — Replace',
      subPrompt:
        'Now say this: "God, I give you this lie. What do you give me in return?" Wait for Him. It may come as a scripture, a single word, or a simple sentence. He always answers. Don\'t fill the silence — just receive.',
      scripture: null,
      scriptureRef: null,
      duration: 60,
      allowSkip: true,
      extendedSilence: false,
    },

    // ── 11 · RESPOND · 130s ──────────────────────────────
    {
      type: 'RESPOND',
      content: 'Receive the Truth. Write It Down.',
      subPrompt:
        "Write down exactly what He gives you — this is your weapon. Write it clearly and specifically. You'll return to this truth again and again. Take all the time you need.",
      scripture: null,
      scriptureRef: null,
      duration: 130,
      allowSkip: true,
      extendedSilence: true,
    },

    // ── 12 · TEACH · 90s ─────────────────────────────────
    {
      type: 'TEACH',
      content: 'Truth Requires Repetition to Take Root',
      subPrompt:
        'The lie took years to form. Truth renews the mind through repetition, not one moment. Read this passage slowly. Let it agree with what He just spoke to you.',
      scripture:
        "Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God's will is — his good, pleasing and perfect will.",
      scriptureRef: 'Romans 12:2',
      duration: 90,
      allowSkip: true,
    },

    // ── 13 · DECLARE · 95s ───────────────────────────────
    {
      type: 'DECLARE',
      content: 'Declare the Truth Out Loud',
      subPrompt:
        'Speak this aloud, filling in the truth God gave you: "I declare that [the truth He gave]. This is who God says I am. I choose to agree with Him. His Word is final. My feelings must come into alignment with His truth."',
      scripture: null,
      scriptureRef: null,
      duration: 95,
      allowSkip: true,
    },

    // ── 14 · INTRO · 115s ────────────────────────────────
    {
      type: 'INTRO',
      content: 'Well Done. Keep the Truth Close.',
      subPrompt:
        "What you did today took real courage. The enemy will test the truth you just received — probably soon. When he does, speak it again. Write it somewhere you'll see it daily. Pray: \"Holy Spirit, keep what You revealed alive in me.\"",
      scripture: 'So if the Son sets you free, you will be free indeed.',
      scriptureRef: 'John 8:36',
      duration: 115,
      allowSkip: true,
    },

  ],
};

// Duration check: 40+50+55+65+65+130+140+60+105+60+130+90+95+115 = 1200 ✓


// ============================================
// ACTIVATION 2: IDENTITY SHIFT (WEEK 10)
// Mirror Test · Listening Prayer · Identity Battle Plan
// 19 cards — 1200 seconds / 20 minutes
// ============================================

export const identityShiftActivation: GuidedActivation = {
  id: 'identity-shift',
  week: 10,
  title: 'Identity Shift',
  subtitle: 'Mirror Test · Listening Prayer · Battle Plan',
  description:
    "A 20-minute guided activation to confront the gap between how you see yourself and how God sees you — then build a scripture-based Identity Battle Plan. Grab your journal.",
  durationMinutes: 20,
  totalDuration: 1200,
  cards: [

    // ── 1 · INTRO · 30s ──────────────────────────────────
    {
      type: 'INTRO',
      content: 'Welcome to Identity Shift',
      subPrompt:
        "Grab a journal or sheet of paper and get ready to write down some thoughts. We are looking for the real answer — not the right answer. So be honest.",
      scripture: null,
      scriptureRef: null,
      duration: 30,
      allowSkip: false,
    },

    // ── 2 · TEACH · 40s ──────────────────────────────────
    {
      type: 'TEACH',
      content: 'The Mirror Test',
      subPrompt:
        "When you look in the mirror, what do you see? Not the Christian answer. Not what you're supposed to say. The real, unfiltered answer. That answer reveals a lot — including some things God wants to heal.",
      scripture: null,
      scriptureRef: null,
      duration: 40,
      allowSkip: true,
    },

    // ── 3 · RESPOND · 160s ───────────────────────────────
    {
      type: 'RESPOND',
      content: 'Write Your Honest Answer',
      subPrompt:
        'Open your journal. At the top write: "When I look in the mirror, I see..." Then finish it honestly. This isn\'t for anyone else. No performance here — just truth.',
      scripture: null,
      scriptureRef: null,
      duration: 160,
      allowSkip: true,
      extendedSilence: true,
    },

    // ── 4 · LISTEN · 55s ─────────────────────────────────
    {
      type: 'LISTEN',
      content: "Now Let's Ask God",
      subPrompt:
        'Ask Him out loud: say "God, when You look at me, what do You see?" Then be still. Just listen. Don\'t rush to fill the silence. What He says may surprise you.',
      scripture: null,
      scriptureRef: null,
      duration: 55,
      allowSkip: true,
      extendedSilence: false,
    },

    // ── 5 · RESPOND · 180s ───────────────────────────────
    {
      type: 'RESPOND',
      content: 'Listen and Write What He Says',
      subPrompt:
        "Give Him time. Write down whatever comes — a word, a feeling, a scripture, an image. Don't dismiss what you receive. Don't argue with it. Just write. He is speaking.",
      scripture: null,
      scriptureRef: null,
      duration: 180,
      allowSkip: true,
      extendedSilence: true,
    },

    // ── 6 · TEACH · 65s ──────────────────────────────────
    {
      type: 'TEACH',
      content: 'The Identity Gap',
      subPrompt:
        "You now have two answers. Look at both and compare. What do you notice about your answer vs what God says about you? This is where the breakthrough happens.",
      scripture: null,
      scriptureRef: null,
      duration: 65,
      allowSkip: true,
    },

    // ── 7 · TEACH · 55s ──────────────────────────────────
    {
      type: 'TEACH',
      content: 'We Need an Identity Shift',
      subPrompt:
        "God sees you from a place of completion — finished, whole, fully known. We see ourselves from a place of process — unfinished, fallen short, still trying. The gap between those two perspectives is where the enemy does his most damaging work.",
      scripture: null,
      scriptureRef: null,
      duration: 55,
      allowSkip: true,
    },

    // ── 8 · TEACH · 65s ──────────────────────────────────
    {
      type: 'TEACH',
      content: 'Meet Gideon',
      subPrompt:
        "Gideon was hiding in a winepress — the weakest man in the weakest clan — when God showed up and called him \"mighty man of valor.\" His first response? \"Are you sure you have the right person?\" Sound familiar?",
      scripture:
        'When the angel of the Lord appeared to Gideon, he said, "The Lord is with you, mighty warrior." "Pardon me, my lord," Gideon replied, "but if the Lord is with us, why has all this happened to us?"',
      scriptureRef: 'Judges 6:12–13',
      duration: 65,
      allowSkip: true,
    },

    // ── 9 · TEACH · 60s ──────────────────────────────────
    {
      type: 'TEACH',
      content: 'False Humility?',
      subPrompt:
        "When you reject what God says about you, you're not being humble — you're exalting your opinion above His. True humility is agreeing with what God says. Disagreeing with God about who you are is pride in disguise.",
      scripture: null,
      scriptureRef: null,
      duration: 60,
      allowSkip: true,
    },

    // ── 10 · TEACH · 60s ─────────────────────────────────
    {
      type: 'TEACH',
      content: 'False Humility?',
      subPrompt:
        "When you reject what God says about you, you're not being humble — you're exalting your opinion above His. True humility is agreeing with what God says. Disagreeing with God about who you are is pride in disguise.",
      scripture: null,
      scriptureRef: null,
      duration: 60,
      allowSkip: true,
    },

    // ── 11 · DECLARE · 55s ───────────────────────────────
    {
      type: 'DECLARE',
      content: 'Say This Out Loud',
      subPrompt:
        'Speak this aloud and say it like you mean it: "I am who Jesus says I am." Not who your past says. Not who your failures say. Not who your fears say. Say it with power — "I am who Jesus says I am."',
      scripture: null,
      scriptureRef: null,
      duration: 55,
      allowSkip: true,
    },

    // ── 12 · LISTEN · 80s ────────────────────────────────
    {
      type: 'LISTEN',
      content: "Now Let's Ask God Again",
      subPrompt:
        '"God, when You look at me, what do You see?" Write down everything you hear from the Holy Spirit — even if it doesn\'t make sense yet. Maybe this leads to other questions you want to ask God.',
      scripture: null,
      scriptureRef: null,
      duration: 80,
      allowSkip: true,
      extendedSilence: true,
    },

    // ── 13 · TEACH · 30s ─────────────────────────────────
    {
      type: 'TEACH',
      content: 'Your True Identity',
      subPrompt: 'I AM COMPLETE',
      scripture: 'And you are complete in Him, who is the head of all principality and power.',
      scriptureRef: 'Colossians 2:10 NKJV',
      duration: 30,
      allowSkip: true,
    },

    // ── 14 · TEACH · 30s ─────────────────────────────────
    {
      type: 'TEACH',
      content: 'Your True Identity',
      subPrompt: 'I AM CHOSEN',
      scripture: 'We know, dear brothers and sisters, that God loves you and has chosen you to be his own people.',
      scriptureRef: '1 Thessalonians 1:4 NLT',
      duration: 30,
      allowSkip: true,
    },

    // ── 15 · TEACH · 30s ─────────────────────────────────
    {
      type: 'TEACH',
      content: 'Your True Identity',
      subPrompt: 'I AM LOVED',
      scripture: 'As the Father has loved me, so have I loved you. Now remain in my love.',
      scriptureRef: 'John 15:9 NIV',
      duration: 30,
      allowSkip: true,
    },

    // ── 16 · TEACH · 30s ─────────────────────────────────
    {
      type: 'TEACH',
      content: 'Your True Identity',
      subPrompt: 'I AM MORE THAN A CONQUEROR',
      scripture: 'Yet in all these things we are more than conquerors through Him who loved us.',
      scriptureRef: 'Romans 8:37 NKJV',
      duration: 30,
      allowSkip: true,
    },

    // ── 17 · TEACH · 30s ─────────────────────────────────
    {
      type: 'TEACH',
      content: 'Your True Identity',
      subPrompt: 'I AM FEARFULLY AND WONDERFULLY MADE',
      scripture: 'I will praise You, for I am fearfully and wonderfully made; marvelous are Your works, and that my soul knows very well.',
      scriptureRef: 'Psalm 139:14 NKJV',
      duration: 30,
      allowSkip: true,
    },

    // ── 18 · DECLARE · 75s ───────────────────────────────
    {
      type: 'DECLARE',
      content: 'Final Declaration — Speak It Over Yourself',
      subPrompt:
        'Speak this aloud: "I choose today to see myself the way God sees me. I am not what my past says. I am not what my fears say. I am who Jesus says I am — and I will agree with Him until my feelings catch up with the truth."',
      scripture: null,
      scriptureRef: null,
      duration: 75,
      allowSkip: true,
    },

    // ── 19 · INTRO · 70s ─────────────────────────────────
    {
      type: 'INTRO',
      content: 'You Did the Work. Now Walk In It.',
      subPrompt:
        "Identity doesn't shift in a moment — it shifts through daily agreement. Keep your Battle Plan somewhere visible. When you feel like hiding, remember Gideon. God called him a mighty warrior before he believed it. He's calling you the same.",
      scripture:
        'See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!',
      scriptureRef: '1 John 3:1',
      duration: 70,
      allowSkip: true,
    },

  ],
};

// Duration check: 30+40+160+55+180+65+55+65+60+60+55+80+30+30+30+30+30+75+70 = 1200 ✓


// ============================================
// ACTIVATION REGISTRY
// ============================================

export const guidedActivations: GuidedActivation[] = [
  breakingStrongholdsActivation,
  identityShiftActivation,
];

export function getActivationById(id: string): GuidedActivation | undefined {
  return guidedActivations.find(a => a.id === id);
}

export function getActivationByWeek(week: number): GuidedActivation | undefined {
  return guidedActivations.find(a => a.week === week);
}
