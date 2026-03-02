// ============================================
// 4D Prayer Feature - Card Data & Session Builder
// ============================================

export type CardType =
  | 'REVERE'
  | 'REFLECT'
  | 'REQUEST'
  | 'REST'
  | 'INTRO'    // Welcome / orientation
  | 'TEACH'    // Teaching moment
  | 'LISTEN'   // Listening silence (extendedSilence: true)
  | 'DECLARE'  // Read-aloud declaration or prayer
  | 'RESPOND'; // Journaling / writing prompt

export interface PrayerCard {
  type: CardType;
  content: string;
  scripture: string | null;
  scriptureRef?: string | null;
  subPrompt: string;
}

export interface SessionCard extends PrayerCard {
  duration: number;
  allowSkip: boolean;
  cardNumber: number;
  totalOfType: number;
  isUserCard?: boolean;
  cardId?: string;
  extendedSilence?: boolean;
}

export interface UserPrayerCard {
  id: string;
  cloudId: string | null;
  title: string;
  details: string | null;
  status: 'active' | 'answered';
  dateCreated: string;
  updatedAt: string;
  deletedAt: string | null;
  dateAnswered: string | null;
  testimony: string | null;
  prayerCount: number;
  // isShared: boolean; // Disabled for v1 - no sharing yet
}

export interface PrayerSession {
  type: 'personal' | 'guided' | 'activation';
  duration: number;
  totalDuration: number;
  cards: SessionCard[];
}

// ============================================
// 4D PRAYER CARD POOLS
// ============================================

export const revereCards: PrayerCard[] = [
  {
    type: 'REVERE',
    content: 'Holy, holy, holy is the Lord Almighty; the whole earth is full of his glory.',
    scripture: 'Holy, holy, holy is the Lord Almighty; the whole earth is full of his glory.',
    scriptureRef: 'Isaiah 6:3',
    subPrompt: "Let the weight of God's holiness settle over you. He is set apart, perfect, and worthy of all praise."
  },
  {
    type: 'REVERE',
    content: 'The Lord is compassionate and gracious, slow to anger, abounding in love.',
    scripture: 'The Lord is compassionate and gracious, slow to anger, abounding in love.',
    scriptureRef: 'Psalm 103:8',
    subPrompt: "Meditate on God's tender heart toward you. His patience and kindness have no end."
  },
  {
    type: 'REVERE',
    content: 'Great is the Lord and most worthy of praise; his greatness no one can fathom.',
    scripture: 'Great is the Lord and most worthy of praise; his greatness no one can fathom.',
    scriptureRef: 'Psalm 145:3',
    subPrompt: 'Consider how vast and immeasurable God is. Let wonder fill your heart.'
  },
  {
    type: 'REVERE',
    content: 'The Lord is my light and my salvation—whom shall I fear?',
    scripture: 'The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?',
    scriptureRef: 'Psalm 27:1',
    subPrompt: 'In His presence, fear loses its grip. Rest in the safety of who He is.'
  },
  {
    type: 'REVERE',
    content: 'For the Lord is good and his love endures forever; his faithfulness continues through all generations.',
    scripture: 'For the Lord is good and his love endures forever; his faithfulness continues through all generations.',
    scriptureRef: 'Psalm 100:5',
    subPrompt: 'Remember His faithfulness in your life. He has never failed you and never will.'
  },
  {
    type: 'REVERE',
    content: 'Be still, and know that I am God.',
    scripture: 'He says, "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."',
    scriptureRef: 'Psalm 46:10',
    subPrompt: 'Release the need to strive. Simply be present with the One who holds all things.'
  },
  {
    type: 'REVERE',
    content: 'The heavens declare the glory of God; the skies proclaim the work of his hands.',
    scripture: 'The heavens declare the glory of God; the skies proclaim the work of his hands.',
    scriptureRef: 'Psalm 19:1',
    subPrompt: 'All creation points to His majesty. What in creation has revealed God to you?'
  },
  {
    type: 'REVERE',
    content: 'Who is like you, Lord God Almighty? You are mighty, and your faithfulness surrounds you.',
    scripture: 'Who is like you, Lord God Almighty? You, Lord, are mighty, and your faithfulness surrounds you.',
    scriptureRef: 'Psalm 89:8',
    subPrompt: 'There is no one like Him. Let your heart declare His uniqueness and power.'
  },
  {
    type: 'REVERE',
    content: 'The Lord reigns, let the earth be glad; let the distant shores rejoice.',
    scripture: 'The Lord reigns, let the earth be glad; let the distant shores rejoice.',
    scriptureRef: 'Psalm 97:1',
    subPrompt: "He is King over all. Surrender any area where you've been trying to reign instead."
  },
  {
    type: 'REVERE',
    content: 'Oh, the depth of the riches of the wisdom and knowledge of God!',
    scripture: 'Oh, the depth of the riches of the wisdom and knowledge of God! How unsearchable his judgments, and his paths beyond tracing out!',
    scriptureRef: 'Romans 11:33',
    subPrompt: 'His wisdom is beyond comprehension. Trust that He sees what you cannot.'
  },
  {
    type: 'REVERE',
    content: 'I am the Alpha and the Omega, the First and the Last, the Beginning and the End.',
    scripture: 'Revelation 22:13',
    subPrompt: 'He was before all things and holds all things together. Worship the eternal God.'
  },
  {
    type: 'REVERE',
    content: 'God is love.',
    scripture: '1 John 4:8',
    subPrompt: "Love isn't just something He does — it's who He is. Let that truth wash over you."
  },
  {
    type: 'REVERE',
    content: 'The Lord is my shepherd, I lack nothing.',
    scripture: 'Psalm 23:1',
    subPrompt: 'He provides everything you truly need. Worship the God who lacks nothing and gives generously.'
  },
  {
    type: 'REVERE',
    content: 'Your word, Lord, is eternal; it stands firm in the heavens.',
    scripture: 'Psalm 119:89',
    subPrompt: "His Word doesn't shift with culture, circumstance, or your feelings. Praise the God who never changes."
  },
  {
    type: 'REVERE',
    content: 'The earth is the Lord\'s, and everything in it, the world, and all who live in it.',
    scripture: 'Psalm 24:1',
    subPrompt: 'Everything belongs to Him. Release your grip and worship the God who owns it all.'
  },
  {
    type: 'REVERE',
    content: 'I will exalt you, Lord, for you lifted me out of the depths.',
    scripture: 'Psalm 30:1',
    subPrompt: 'Think of a time He pulled you out of a hard season. Let that memory fuel your worship.'
  },
  {
    type: 'REVERE',
    content: "His divine power has given us everything we need for a godly life through our knowledge of him.",
    scripture: '2 Peter 1:3',
    subPrompt: 'You are not lacking. He has already given you everything you need. Worship the generous God.'
  },
  {
    type: 'REVERE',
    content: 'The Lord your God is God of gods and Lord of lords, the great God, mighty and awesome.',
    scripture: 'Deuteronomy 10:17',
    subPrompt: 'There is no authority above Him. Let that truth bring security to your heart.'
  },
  {
    type: 'REVERE',
    content: 'For in him all things were created: things in heaven and on earth, visible and invisible.',
    scripture: 'Colossians 1:16',
    subPrompt: 'He created everything you can see and everything you cannot. Marvel at the Creator.'
  },
  {
    type: 'REVERE',
    content: 'Jesus Christ is the same yesterday and today and forever.',
    scripture: 'Hebrews 13:8',
    subPrompt: 'The God who was faithful then is faithful now. Worship the unchanging One.'
  },
  {
    type: 'REVERE',
    content: 'The Lord is righteous in all his ways and faithful in all he does.',
    scripture: 'Psalm 145:17',
    subPrompt: 'Even when life feels unfair, He is perfectly just. Trust His character today.'
  },
  {
    type: 'REVERE',
    content: 'How priceless is your unfailing love, O God! People take refuge in the shadow of your wings.',
    scripture: 'Psalm 36:7',
    subPrompt: 'His love is priceless — it cannot be earned or lost. Rest under the shadow of His wings.'
  },
  {
    type: 'REVERE',
    content: 'Worthy is the Lamb, who was slain, to receive power and wealth and wisdom and strength and honor and glory and praise!',
    scripture: 'Revelation 5:12',
    subPrompt: 'He gave everything. Let that sacrifice move your heart to deep worship.'
  },
  {
    type: 'REVERE',
    content: "I am the way and the truth and the life.",
    scripture: 'John 14:6',
    subPrompt: 'He is not a way — He is the way. Worship Jesus, the one who makes a way where there is none.'
  },
  {
    type: 'REVERE',
    content: 'Your steadfast love, O Lord, extends to the heavens, your faithfulness to the clouds.',
    scripture: 'Psalm 36:5 ESV',
    subPrompt: "His love is higher than you can measure. Let that reality lift you above your circumstances today."
  },
];

export const reflectCards: PrayerCard[] = [
  {
    type: 'REFLECT',
    content: 'Search me, God, and know my heart; test me and know my anxious thoughts.',
    scripture: 'Search me, God, and know my heart; test me and know my anxious thoughts. See if there is any offensive way in me, and lead me in the way everlasting.',
    scriptureRef: 'Psalm 139:23–24',
    subPrompt: 'Invite God to examine you. What is He highlighting in your heart right now?'
  },
  {
    type: 'REFLECT',
    content: 'What is currently stealing my peace?',
    scripture: null,
    subPrompt: 'Be honest. Name the worry, fear, or distraction. Bring it into the light.'
  },
  {
    type: 'REFLECT',
    content: 'Where have I been striving instead of trusting?',
    scripture: null,
    subPrompt: "Reflect on areas where you've relied on your own strength. What would surrender look like?"
  },
  {
    type: 'REFLECT',
    content: 'Is there anyone I need to forgive?',
    scripture: null,
    subPrompt: 'Let faces and names come to mind. Unforgiveness only imprisons you.'
  },
  {
    type: 'REFLECT',
    content: 'What am I truly grateful for today?',
    scripture: null,
    subPrompt: "Gratitude shifts perspective. List specific things—big and small—that reveal God's goodness."
  },
  {
    type: 'REFLECT',
    content: 'Am I believing any lies about myself right now?',
    scripture: null,
    subPrompt: 'What negative thoughts have been on repeat? Compare them to what God says about you.'
  },
  {
    type: 'REFLECT',
    content: 'How have I seen God move in my life recently?',
    scripture: null,
    subPrompt: "Recall answered prayers, unexpected provision, or moments of His presence. Don't forget His faithfulness."
  },
  {
    type: 'REFLECT',
    content: 'What is God inviting me to trust Him with?',
    scripture: null,
    subPrompt: "There's often something He's asking us to release. What keeps coming to mind?"
  },
  {
    type: 'REFLECT',
    content: 'Where do I need to extend grace to myself?',
    scripture: null,
    subPrompt: "God's grace covers you. Are you accepting it or punishing yourself for past failures?"
  },
  {
    type: 'REFLECT',
    content: 'What would it look like to live fully surrendered today?',
    scripture: null,
    subPrompt: 'Imagine walking through your day completely yielded to God. What would change?'
  },
  {
    type: 'REFLECT',
    content: 'Is my relationship with God growing or have I been going through the motions?',
    scripture: null,
    subPrompt: "Be honest — not critical. What has distance looked like? What has closeness looked like? What's the difference?"
  },
  {
    type: 'REFLECT',
    content: 'What fear am I allowing to drive my decisions?',
    scripture: null,
    subPrompt: "Name it. Fear of failure, rejection, the unknown? Hand it to God and ask what faith-based action looks like."
  },
  {
    type: 'REFLECT',
    content: 'Where is God asking me to be obedient, and am I doing it?',
    scripture: null,
    subPrompt: "There's often something you already know He's asking. Is there a step you've been putting off?"
  },
  {
    type: 'REFLECT',
    content: 'How am I doing in my closest relationships?',
    scripture: null,
    subPrompt: 'Think about your family, friendships, and community. Where do you need to invest more? Where is there unresolved tension?'
  },
  {
    type: 'REFLECT',
    content: 'What has God spoken to me recently that I haven\'t fully received?',
    scripture: null,
    subPrompt: "Sometimes He speaks and we hear but don't act. What truth has He shown you that you're still holding at arm's length?"
  },
  {
    type: 'REFLECT',
    content: 'Am I serving from overflow or from obligation?',
    scripture: null,
    subPrompt: 'Check your motives. Are you giving, serving, or showing up out of love — or out of pressure?'
  },
  {
    type: 'REFLECT',
    content: 'What have I been avoiding that I need to face?',
    scripture: null,
    subPrompt: "God often meets us in the places we'd rather not go. What conversation, decision, or emotion needs your attention?"
  },
  {
    type: 'REFLECT',
    content: 'Where am I measuring my worth by performance?',
    scripture: null,
    subPrompt: "Your value isn't tied to your output. Where are you striving for approval — from God, others, or yourself?"
  },
  {
    type: 'REFLECT',
    content: 'What has God done in my past that I need to remember right now?',
    scripture: null,
    subPrompt: "Israel was always told to remember. What is a specific moment of God's faithfulness that applies to what you're facing today?"
  },
  {
    type: 'REFLECT',
    content: 'Is there an area of my life where I\'ve stopped expecting God to move?',
    scripture: null,
    subPrompt: 'Disappointment can quietly drain our faith. Where have you settled for less than what God promised? Ask Him to restore your hope.'
  },
  {
    type: 'REFLECT',
    content: 'What does the fruit of my life say about what I actually believe?',
    scripture: 'By their fruit you will recognize them.',
    scriptureRef: 'Matthew 7:16',
    subPrompt: "Our actions reveal our deepest convictions. Does the pattern of your life reflect trust in God — or trust in yourself?"
  },
  {
    type: 'REFLECT',
    content: 'Am I more in love with Jesus today than I was a year ago?',
    scripture: null,
    subPrompt: "If the answer is yes, what has deepened your love? If no — what has gotten in the way? Let that question be a conversation with Him."
  },
  {
    type: 'REFLECT',
    content: 'Where do I need to repent today?',
    scripture: null,
    subPrompt: "Repentance isn't shame — it's turning back. Ask the Holy Spirit to show you anything that needs to be confessed and released."
  },
  {
    type: 'REFLECT',
    content: 'How is God shaping my character through what I\'m currently walking through?',
    scripture: null,
    subPrompt: "Hard seasons aren't wasted. What might He be building in you through this difficulty? Ask Him to help you see it."
  },
  {
    type: 'REFLECT',
    content: 'What does God want me to know about myself today?',
    scripture: null,
    subPrompt: 'Ask Him directly. Then be quiet and listen. Write down whatever comes.'
  },
];

export const restCards: PrayerCard[] = [
  {
    type: 'REST',
    content: 'Come to me, all you who are weary and burdened, and I will give you rest.',
    scripture: 'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.',
    scriptureRef: 'Matthew 11:28–29',
    subPrompt: 'Lay down your burdens. He is not asking you to carry them alone.'
  },
  {
    type: 'REST',
    content: 'You are held. You are loved. You are His.',
    scripture: 'I am my beloved\'s and my beloved is mine.',
    scriptureRef: 'Song of Songs 6:3',
    subPrompt: 'Let these truths sink deep. Nothing can separate you from His love.'
  },
  {
    type: 'REST',
    content: 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you.',
    scripture: 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.',
    scriptureRef: 'Zephaniah 3:17',
    subPrompt: 'He delights in you—not your performance. Rest in His joy over you.'
  },
  {
    type: 'REST',
    content: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.',
    scripture: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.',
    scriptureRef: 'Psalm 4:8',
    subPrompt: 'Release every anxious thought. Your safety is in His hands.'
  },
  {
    type: 'REST',
    content: 'He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
    scripture: 'He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. He guides me along the right paths for his name\'s sake.',
    scriptureRef: 'Psalm 23:2–3',
    subPrompt: "Let the Good Shepherd restore you. You don't have to figure everything out."
  },
  {
    type: 'REST',
    content: 'My presence will go with you, and I will give you rest.',
    scripture: 'The Lord replied, "My Presence will go with you, and I will give you rest."',
    scriptureRef: 'Exodus 33:14',
    subPrompt: 'His presence is your promise. Wherever you go, He goes with you.'
  },
  {
    type: 'REST',
    content: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    scripture: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    scriptureRef: 'Philippians 4:6–7',
    subPrompt: "God isn't measuring your productivity. He simply wants you. Receive His peace."
  },
  {
    type: 'REST',
    content: 'Cast all your anxiety on him because he cares for you.',
    scripture: 'Cast all your anxiety on him because he cares for you.',
    scriptureRef: '1 Peter 5:7',
    subPrompt: "Physically release tension in your body. Breathe deeply. He's got this."
  },
  {
    type: 'REST',
    content: "The battle is not yours, but God's.",
    scripture: 'This is what the Lord says to you: "Do not be afraid or discouraged because of this vast army. For the battle is not yours, but God\'s."',
    scriptureRef: '2 Chronicles 20:15',
    subPrompt: 'Stop fighting in your own strength. He is fighting for you.'
  },
  {
    type: 'REST',
    content: 'Be at rest once more, O my soul, for the Lord has been good to you.',
    scripture: 'Return to your rest, my soul, for the Lord has been good to you.',
    scriptureRef: 'Psalm 116:7',
    subPrompt: 'Return to peace. Remember His goodness. Trust His heart.'
  },
  {
    type: 'REST',
    content: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.',
    scripture: 'Romans 8:38–39',
    subPrompt: "Nothing has separated you from His love. Nothing can. Let that be enough right now."
  },
  {
    type: 'REST',
    content: 'The Lord is near to all who call on him, to all who call on him in truth.',
    scripture: 'Psalm 145:18',
    subPrompt: 'He is not far away. He is here, now, close enough to hear a whisper. Just call on Him.'
  },
  {
    type: 'REST',
    content: "I have learned, in whatever state I am, to be content.",
    scripture: 'Philippians 4:11 NKJV',
    subPrompt: 'Contentment is learned, not given. Ask God to teach you peace right where you are, exactly as things are.'
  },
  {
    type: 'REST',
    content: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.',
    scripture: 'Isaiah 26:3',
    subPrompt: "Fix your mind on Him — not on the problem. Peace is a byproduct of trust."
  },
  {
    type: 'REST',
    content: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me.',
    scripture: 'Psalm 23:4',
    subPrompt: "He doesn't promise to remove every dark valley — He promises to walk through it with you. You are not alone."
  },
  {
    type: 'REST',
    content: 'God is our refuge and strength, an ever-present help in trouble.',
    scripture: 'Psalm 46:1',
    subPrompt: 'Run to Him, not away from the problem. He is your refuge. Let Him be strong where you are weak.'
  },
  {
    type: 'REST',
    content: "He gives strength to the weary and increases the power of the weak.",
    scripture: 'Isaiah 40:29',
    subPrompt: "You don't have to manufacture energy or motivation. Ask Him to strengthen you — and then receive it."
  },
  {
    type: 'REST',
    content: 'Therefore, there is now no condemnation for those who are in Christ Jesus.',
    scripture: 'Romans 8:1',
    subPrompt: "Whatever you're carrying from yesterday — it has been paid for. You are not condemned. Rest in that truth."
  },
  {
    type: 'REST',
    content: 'For we are God\'s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.',
    scripture: 'Ephesians 2:10',
    subPrompt: "You are not an accident. Your life has purpose that was designed before you were born. Rest in your design."
  },
  {
    type: 'REST',
    content: 'Let the peace of Christ rule in your hearts, since as members of one body you were called to peace.',
    scripture: 'Colossians 3:15',
    subPrompt: "Let His peace be the umpire of your heart today. Where peace is absent, invite Him in."
  },
  {
    type: 'REST',
    content: "See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!",
    scripture: '1 John 3:1',
    subPrompt: "You are a beloved child of God — not a servant, not a project. Receive His lavish love right now."
  },
  {
    type: 'REST',
    content: 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace.',
    scripture: 'Numbers 6:24–26',
    subPrompt: "Receive this blessing over yourself. Read it slowly. Let every word land."
  },
  {
    type: 'REST',
    content: "My grace is sufficient for you, for my power is made perfect in weakness.",
    scripture: '2 Corinthians 12:9',
    subPrompt: "Your weakness is not an obstacle — it's an invitation. Where you have nothing left, His grace is most at home."
  },
  {
    type: 'REST',
    content: "Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    scripture: 'Isaiah 40:31',
    subPrompt: "Place your hope in Him — not in your circumstances improving. Strength follows hope. Ask Him to renew yours."
  },
  {
    type: 'REST',
    content: 'For the Lord takes delight in his people; he crowns the humble with victory.',
    scripture: 'Psalm 149:4',
    subPrompt: "He doesn't just tolerate you — He delights in you. Sit with that for a moment."
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// CARD DISTRIBUTION LOGIC
// ============================================

// Total cards per session duration
const totalCardsMap: Record<number, number> = {
  5: 4,
  10: 8,
  15: 12,
  20: 16,
  25: 20,
  30: 25,
  35: 28,
  40: 33,
  45: 36,
  50: 40,
  55: 44,
  60: 48
};

// Get total cards for a duration (interpolate if not exact match)
function getTotalCards(durationMinutes: number): number {
  if (totalCardsMap[durationMinutes]) {
    return totalCardsMap[durationMinutes];
  }
  // Find closest duration
  const durations = Object.keys(totalCardsMap).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < durations.length - 1; i++) {
    if (durationMinutes > durations[i] && durationMinutes < durations[i + 1]) {
      // Interpolate
      const ratio = (durationMinutes - durations[i]) / (durations[i + 1] - durations[i]);
      const lower = totalCardsMap[durations[i]];
      const upper = totalCardsMap[durations[i + 1]];
      return Math.round(lower + ratio * (upper - lower));
    }
  }
  // Default to max if over 60
  return totalCardsMap[60];
}

// Determine Revere/Reflect/Rest cards count (2, 3, or 4) based on duration
function getSystemCardsPerType(durationMinutes: number): number {
  if (durationMinutes <= 10) return 2;
  if (durationMinutes <= 25) return 3;
  return 4; // Max at 4
}

// ============================================
// SESSION BUILDER
// ============================================

export function get4DCards(durationMinutes: number): {
  revere: PrayerCard[];
  reflect: PrayerCard[];
  rest: PrayerCard[];
  cardsPerType: number;
} {
  const cardsPerType = getSystemCardsPerType(durationMinutes);

  const revere = shuffleArray(revereCards).slice(0, cardsPerType);
  const reflect = shuffleArray(reflectCards).slice(0, cardsPerType);
  const rest = shuffleArray(restCards).slice(0, cardsPerType);

  return { revere, reflect, rest, cardsPerType };
}

export function build4DSession(
  durationMinutes: number,
  userPrayerCards: UserPrayerCard[] = []
): PrayerSession {
  const { revere, reflect, rest, cardsPerType } = get4DCards(durationMinutes);

  // Calculate total cards and how many user cards to include
  const totalCards = getTotalCards(durationMinutes);
  const systemCards = cardsPerType * 3; // Revere + Reflect + Rest
  const userCardsCount = Math.max(0, totalCards - systemCards);

  // Get active user cards only, shuffle and limit
  const activeUserCards = userPrayerCards.filter(c => c.status === 'active' && !c.deletedAt);
  const selectedUserCards = shuffleArray(activeUserCards).slice(0, userCardsCount);

  // Calculate duration per card (in seconds)
  const totalSeconds = durationMinutes * 60;
  const actualTotalCards = systemCards + selectedUserCards.length;
  const baseCardDuration = Math.floor(totalSeconds / actualTotalCards);

  // Build session cards array in order: Revere -> Reflect -> Request (user cards) -> Rest
  const sessionCards: SessionCard[] = [];

  // Add Revere cards
  revere.forEach((card, index) => {
    sessionCards.push({
      ...card,
      duration: baseCardDuration,
      allowSkip: true,
      cardNumber: index + 1,
      totalOfType: cardsPerType
    });
  });

  // Add Reflect cards
  reflect.forEach((card, index) => {
    sessionCards.push({
      ...card,
      duration: baseCardDuration,
      allowSkip: true,
      extendedSilence: true,
      cardNumber: index + 1,
      totalOfType: cardsPerType
    });
  });

  // Add user's Request/Prayer cards
  selectedUserCards.forEach((card, index) => {
    sessionCards.push({
      type: 'REQUEST',
      content: card.title,
      subPrompt: card.details || 'Lift this request to God. Listen for His response.',
      scripture: null,
      duration: baseCardDuration,
      allowSkip: true,
      isUserCard: true,
      cardId: card.id,
      cardNumber: index + 1,
      totalOfType: selectedUserCards.length
    });
  });

  // Add Rest cards
  rest.forEach((card, index) => {
    sessionCards.push({
      ...card,
      duration: baseCardDuration,
      allowSkip: true,
      cardNumber: index + 1,
      totalOfType: cardsPerType
    });
  });

  return {
    type: 'personal',
    duration: durationMinutes,
    totalDuration: totalSeconds,
    cards: sessionCards
  };
}

// ============================================
// THEME DEFINITIONS
// ============================================

export type PrayerTheme = 'fire' | 'ocean' | 'forest';

export const themes: Record<PrayerTheme, {
  name: string;
  gradient: string;
  accentColor: string;
  particleColor: string;
}> = {
  fire: {
    name: 'Fire',
    gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d1810 30%, #1a0505 60%, #0a0202 100%)',
    accentColor: '#ff6b35',
    particleColor: '#ff9500'
  },
  ocean: {
    name: 'Ocean',
    gradient: 'linear-gradient(135deg, #0a1a2e 0%, #0d2a4a 30%, #051525 60%, #020a10 100%)',
    accentColor: '#00d4ff',
    particleColor: '#4fc3f7'
  },
  forest: {
    name: 'Forest',
    gradient: 'linear-gradient(135deg, #0a1a0a 0%, #102d10 30%, #051505 60%, #020a02 100%)',
    accentColor: '#7ed56f',
    particleColor: '#81c784'
  }
};

// ============================================
// MUSIC TRACKS
// ============================================

export interface MusicTrack {
  id: string;
  name: string;
  file: string;
}

export const musicTracks: MusicTrack[] = [
  { id: 'piano-prayer', name: 'Piano Prayer', file: '/audio/piano-prayer.mp3' },
  { id: 'celestial-prayer', name: 'Celestial Prayer', file: '/audio/celestial-prayer.mp3' },
  { id: 'worship-prayer', name: 'Worship Prayer', file: '/audio/worship-prayer.mp3' },
  { id: 'soothing-worship', name: 'Soothing Worship', file: '/audio/soothing-worship.mp3' },
  { id: 'peaceful-piano', name: 'Peaceful Piano', file: '/audio/peaceful-piano.mp3' },
  { id: 'christian-worship', name: 'Christian Worship', file: '/audio/christian-worship.mp3' },
  { id: 'beautiful-worship', name: 'Beautiful Worship', file: '/audio/beautiful-worship.mp3' },
  { id: 'piano-inst', name: 'Piano Instrumental', file: '/audio/piano-inst.mp3' },
  { id: 'ambient-peace', name: 'Ambient Peace', file: '/audio/ambient-peace.mp3' }
];

// ============================================
// 4D PRAYER INFO CONTENT
// ============================================

export const prayerInfo = {
  title: '4D Prayer',
  tagline: 'A structured approach to meeting with God',
  scripture: '"Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective."',
  scriptureRef: 'James 5:16 NIV',
  dimensions: [
    {
      name: 'REVERE',
      tagline: 'Worship & Adoration',
      description: 'Begin by focusing on who God is. Let the weight of His holiness, love, and power settle over you.',
      tip: 'Use scripture to guide your worship. Let your heart respond to His character.'
    },
    {
      name: 'REFLECT',
      tagline: 'Self-Examination & Listening',
      description: 'Invite God to search your heart. What is He highlighting? What needs to be surrendered?',
      tip: 'Be honest and open. This is a safe space between you and God.'
    },
    {
      name: 'REQUEST',
      tagline: 'Personal Prayer Cards',
      description: 'Lift your specific prayer requests to God. These are the people and situations on your heart.',
      tip: 'Pray with expectation. God hears every prayer.'
    },
    {
      name: 'REST',
      tagline: "Receiving God's Peace",
      description: "Close by receiving. Let God's truth and peace wash over you. You don't have to perform.",
      tip: 'Simply be present with Him. Let go of striving.'
    }
  ],
  tips: [
    'Find a quiet, distraction-free space',
    'Use headphones for immersive worship music',
    'Keep a journal nearby to capture what God speaks',
    'Start with shorter sessions and build up',
    "Don't rush—let each prompt settle"
  ]
};
