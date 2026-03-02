import type { PhaseDefinition, MonthDefinition, WeekDefinition } from '@/types/pathway';

// ============================================
// MONTH 1: BUILDING HABITS (Weeks 1-4)
// ============================================

export const MONTH_1: MonthDefinition = {
  month: 1,
  title: 'Building Habits',
  weeks: [
    {
      weekNumber: 1,
      month: 1,
      title: 'Life Assessment',
      subtitle: 'Understanding Where You Are',
      teaching:
        'This week you\'ll complete a Life Assessment — a baseline snapshot of your spiritual, emotional, relational, and practical health.\n\n' +
        'This isn\'t about being "spiritual enough" — it\'s about identifying where you are so you can grow. Answer honestly. You\'ll retake this at Week 12 to measure your growth.\n\n' +
        'Your leader will guide a discussion after you complete it. Be prepared to share a few answers that stood out to you.',
      checkpoints: [
        {
          id: 'w1-life-assessment',
          label: 'Complete Life Assessment',
          trackingType: 'self-marked',
          toolLink: { label: 'Start Assessment', href: '/tools/life-assessment' },
        },
      ],
      toolLinks: [],
    },
    {
      weekNumber: 2,
      month: 1,
      title: '3D Journal',
      subtitle: 'Learning to Hear God Through Scripture',
      teaching:
        'The 3D Journal is a simple method for hearing God through Scripture. Most Christians struggle with Bible reading because they don\'t know how to move from information to transformation. The 3D Journal bridges that gap.\n\n' +
        'How it works:\n' +
        '• Scripture — Everyday you receive Today\'s Scripture or choose your own\n' +
        '• HEAD — What is this passage saying? What does it reveal about God?\n' +
        '• HEART — What is God saying to YOU right now through this Scripture?\n' +
        '• HANDS — What action should you take? What does God want you to do?',
      checkpoints: [
        {
          id: 'w2-journal-entry',
          label: 'Created first journal entry',
          trackingType: 'self-marked',
          toolLink: { label: 'Open 3D Journal', href: '/journal' },
        },
        {
          id: 'w2-challenge-started',
          label: 'Started 3D Bible Challenge',
          trackingType: 'self-marked',
          toolLink: { label: 'Join Challenge', href: '/journal' },
        },
      ],
      toolLinks: [
        { label: '3D Journal', href: '/journal' },
      ],
    },
    {
      weekNumber: 3,
      month: 1,
      title: '4D Prayer',
      subtitle: 'Revere, Reflect, Request, Rest',
      teaching:
        'Prayer isn\'t just asking God for things — it\'s partnering with Him. Jesus stands in the gap for us (Hebrews 7:25); because we\'re in Him, we stand in the gap for others.\n\n' +
        'The 4D Prayer Rhythm:\n' +
        '1. REVERE — Worship God for who He is\n' +
        '2. REFLECT — Thank God for what He\'s done\n' +
        '3. REQUEST — Intercede for others (your prayer cards)\n' +
        '4. REST — Be still and listen\n\n' +
        'This week, you\'ll create prayer cards for people and situations you want to pray for. Then you\'ll practice the 4D rhythm in a timed prayer session.',
      checkpoints: [
        {
          id: 'w3-prayer-card',
          label: 'Created first prayer card',
          trackingType: 'self-marked',
          toolLink: { label: 'Create Prayer Card', href: '/prayer' },
        },
        {
          id: 'w3-prayer-session',
          label: 'Completed first prayer session',
          trackingType: 'self-marked',
          toolLink: { label: 'Start Prayer Session', href: '/prayer' },
        },
      ],
      toolLinks: [
        { label: '4D Prayer', href: '/prayer' },
      ],
    },
    {
      weekNumber: 4,
      month: 1,
      title: 'Creed Cards',
      subtitle: 'Building Theological Foundation',
      teaching:
        'A creed is a statement of belief. Throughout Christian history, the church has used creeds to say, "These are the non-negotiables. These are the truths we stand on together."\n\n' +
        'Creed Cards help you learn and wrestle with foundational truths — bite-sized, biblical doctrines rooted in 2,000 years of Christian history.\n\n' +
        'This week in your meeting, you\'ll work through Creed Cards together and discuss what you believe. This isn\'t about having all the answers — it\'s about building a foundation you can stand on.',
      checkpoints: [
        {
          id: 'w4-creed-reviewed',
          label: 'Reviewed Creed Cards',
          trackingType: 'self-marked',
          toolLink: { label: 'Open Creed Cards', href: '/creed-cards' },
        },
      ],
      toolLinks: [
        { label: 'Creed Cards', href: '/creed-cards' },
      ],
    },
  ],
};

// ============================================
// MONTH 2: GOING DEEPER (Weeks 5-8)
// ============================================

export const MONTH_2: MonthDefinition = {
  month: 2,
  title: 'Going Deeper',
  weeks: [
    {
      weekNumber: 5,
      month: 2,
      title: 'Q&A Deep Dive',
      subtitle: 'Addressing Doubts and Questions',
      teaching:
        'It\'s okay to have questions. It\'s okay to doubt. This week is a safe space to bring your hardest questions about faith, the Bible, God, or anything else.\n\n' +
        'Come prepared with at least one question you\'ve been wrestling with. Your leader and group will explore it together.',
      checkpoints: [
        {
          id: 'w5-question',
          label: 'Brought a question to discuss',
          trackingType: 'self-marked',
          toolLink: { label: 'Write Your Questions', href: '/tools/qa-questions' },
        },
      ],
      toolLinks: [
        { label: 'Q&A Questions', href: '/tools/qa-questions' },
      ],
    },
    {
      weekNumber: 6,
      month: 2,
      title: 'Listening Prayer Circle',
      subtitle: 'Hearing God for Others',
      teaching:
        'This week you\'ll practice hearing God\'s voice — not just for yourself, but for others. You\'ve been journaling and praying daily. Now it\'s time to step out and speak what you sense God saying to someone else.\n\n' +
        'Don\'t worry about being perfect. Your group is a safe place to practice. God will speak through you.',
      checkpoints: [
        {
          id: 'w6-listening-prayer',
          label: 'Participated in listening prayer',
          trackingType: 'self-marked',
          toolLink: { label: 'Journal Your Experience', href: '/tools/listening-prayer' },
        },
      ],
      toolLinks: [
        { label: 'Listening Prayer Journal', href: '/tools/listening-prayer' },
      ],
    },
    {
      weekNumber: 7,
      month: 2,
      title: 'Outreach/Mission Activity',
      subtitle: 'Applying Faith in the Real World',
      teaching:
        'Faith isn\'t meant to stay inside the walls of a meeting room. This week, your group will do an outreach activity together — putting your faith into action.\n\n' +
        'Tips for preparation:\n' +
        '• Pray for opportunities to share God\'s love\n' +
        '• Be ready to serve without expecting anything in return\n' +
        '• Watch for what God does — you\'ll share testimonies next week\n\n' +
        'Your leader will share details about the specific activity.',
      checkpoints: [
        {
          id: 'w7-outreach',
          label: 'Participated in outreach activity',
          trackingType: 'self-marked',
        },
      ],
      toolLinks: [],
    },
    {
      weekNumber: 8,
      month: 2,
      title: 'Testimony Time',
      subtitle: 'Celebrating God\'s Faithfulness',
      teaching:
        'This week you\'ll celebrate what God has done — both in the outreach and over the past 8 weeks.\n\n' +
        'Come prepared to share:\n' +
        '• What happened during the outreach?\n' +
        '• What has God done in your life over the past 2 months?\n' +
        '• How have you grown?\n\n' +
        'Use the Testimony Builder to capture your stories.',
      checkpoints: [
        {
          id: 'w8-testimony-shared',
          label: 'Shared testimony/outreach experience',
          trackingType: 'self-marked',
        },
        {
          id: 'w8-testimony-created',
          label: 'Created testimony entry',
          trackingType: 'self-marked',
          toolLink: { label: 'Open Testimony Builder', href: '/tools/testimony-builder' },
        },
      ],
      toolLinks: [
        { label: 'Testimony Builder', href: '/tools/testimony-builder' },
      ],
    },
  ],
};

// ============================================
// MONTH 3: BREAKTHROUGH (Weeks 9-12)
// ============================================

export const MONTH_3: MonthDefinition = {
  month: 3,
  title: 'Breakthrough',
  weeks: [
    {
      weekNumber: 9,
      month: 3,
      title: 'Breaking Strongholds',
      subtitle: 'Reveal, Renounce, Replace',
      teaching:
        'A stronghold is a lie you believe that keeps you from freedom. It could be shame, fear, addiction, bitterness, or false beliefs about God or yourself.\n\n' +
        'This week you\'ll identify strongholds and begin the process of breaking them:\n' +
        '1. REVEAL — What lies have you believed?\n' +
        '2. RENOUNCE — Reject the lie out loud\n' +
        '3. REPLACE — Speak God\'s truth over yourself\n\n' +
        'This is deep work. Your group is a safe place to be honest.',
      checkpoints: [
        {
          id: 'w9-stronghold',
          label: 'Identified a stronghold to address',
          trackingType: 'self-marked',
        },
      ],
      toolLinks: [],
    },
    {
      weekNumber: 10,
      month: 3,
      title: 'Identity Shift Workshop',
      subtitle: 'Building Identity in Christ',
      teaching:
        'You are not what you do. You are not what others say about you. You are who GOD says you are.\n\n' +
        'This week is about cementing your identity in Christ — not in performance, success, failure, or the opinions of others.\n\n' +
        'Come ready to hear what God says about you.',
      checkpoints: [
        {
          id: 'w10-identity',
          label: 'Completed identity reflection',
          trackingType: 'self-marked',
        },
      ],
      toolLinks: [],
    },
    {
      weekNumber: 11,
      month: 3,
      title: 'Ministry Gifts Test & Activation',
      subtitle: 'Discovering Your Gifts',
      teaching:
        'God has given you spiritual gifts — unique abilities to serve Him and others. This week you\'ll take the Ministry Gifts Test to discover your gifts.\n\n' +
        'The assessment covers three tiers:\n' +
        '• Tier 1: How you serve (Romans 12 gifts)\n' +
        '• Tier 2: Supernatural empowerment (1 Corinthians 12 gifts)\n' +
        '• Tier 3: Leadership calling (Ephesians 4:11 gifts)\n\n' +
        'Complete the assessment before your meeting. Your leader will guide you through activation.',
      checkpoints: [
        {
          id: 'w11-spiritual-gifts',
          label: 'Complete Ministry Gifts Test',
          trackingType: 'self-marked',
          toolLink: { label: 'Start Assessment', href: '/tools/spiritual-gifts' },
        },
      ],
      toolLinks: [
        { label: 'Ministry Gifts Test', href: '/tools/spiritual-gifts' },
      ],
    },
    {
      weekNumber: 12,
      month: 3,
      title: 'Life Assessment Revisited',
      subtitle: 'Measuring Growth & Setting Goals',
      teaching:
        'You made it! This is your final week of the 90-Day Toolkit.\n\n' +
        'You\'ll retake the Life Assessment you did in Week 1. Compare your answers. See how far you\'ve come.\n\n' +
        'Then, set goals for the next phase. This isn\'t the end — it\'s the beginning of multiplication. You\'re about to become the discipler.',
      checkpoints: [
        {
          id: 'w12-life-assessment',
          label: 'Complete Life Assessment (Week 12)',
          trackingType: 'self-marked',
          toolLink: { label: 'Start Assessment', href: '/tools/life-assessment' },
        },
        {
          id: 'w12-comparison',
          label: 'Reviewed Week 1 vs Week 12 comparison',
          trackingType: 'self-marked',
          toolLink: { label: 'View Comparison', href: '/tools/life-assessment' },
        },
      ],
      toolLinks: [
        { label: 'Life Assessment', href: '/tools/life-assessment' },
      ],
    },
  ],
};

// ============================================
// PHASE DEFINITIONS
// ============================================

export const PHASE_1: PhaseDefinition = {
  id: 1,
  title: 'Foundation',
  subtitle: '90-Day Toolkit',
  description: 'Build daily habits of Scripture, prayer, and theological foundation.',
  months: [MONTH_1, MONTH_2, MONTH_3],
};

export const PHASE_2: PhaseDefinition = {
  id: 2,
  title: 'Growth',
  subtitle: 'Leadership Preparation',
  description: 'Prepare to lead others through co-facilitation and ministry experience.',
};

export const PHASE_3: PhaseDefinition = {
  id: 3,
  title: 'Multiplication',
  subtitle: 'Start Your Own Group',
  description: 'Launch your own DNA group and begin multiplying disciples.',
};

export const ALL_PHASES: PhaseDefinition[] = [PHASE_1, PHASE_2, PHASE_3];

// ============================================
// HELPERS
// ============================================

export function getAllWeeks(): WeekDefinition[] {
  return [MONTH_1, MONTH_2, MONTH_3].flatMap(m => m.weeks);
}

export function getWeeksForMonth(month: 1 | 2 | 3): WeekDefinition[] {
  const months = [MONTH_1, MONTH_2, MONTH_3];
  return months[month - 1].weeks;
}

export function getWeek(weekNumber: number): WeekDefinition | undefined {
  return getAllWeeks().find(w => w.weekNumber === weekNumber);
}

export function getMonth(month: 1 | 2 | 3): MonthDefinition {
  return [MONTH_1, MONTH_2, MONTH_3][month - 1];
}
