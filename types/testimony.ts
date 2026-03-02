// ============================================
// TESTIMONY TYPES
// ============================================

export type TestimonyType =
  | 'salvation'
  | 'healing'
  | 'provision'
  | 'breakthrough'
  | 'everyday_faithfulness'
  | 'transformation'
  | 'relationship_restoration'
  | 'direction_guidance';

export type TestimonyStatus = 'draft' | 'complete';

export type StorySectionKey = 'struggle' | 'turningPoint' | 'outcome' | 'reflection' | 'yourInvitation';

export interface TestimonyEntry {
  id: number;                    // Date.now()
  cloudId: string | null;        // Future Supabase UUID
  localId: string;               // `${deviceId}_${id}`
  syncToken: string | null;      // Future sync

  title: string;
  testimonyType: TestimonyType | null;

  // STORY Framework
  struggle: string;
  turningPoint: string;
  outcome: string;
  reflection: string;
  yourInvitation: string;

  status: TestimonyStatus;

  createdAt: string;             // ISO
  updatedAt: string;             // ISO
  deletedAt: string | null;      // Soft delete
}

export interface TestimonyDraft {
  title: string;
  testimonyType: TestimonyType | null;
  struggle: string;
  turningPoint: string;
  outcome: string;
  reflection: string;
  yourInvitation: string;
  expandedSection: StorySectionKey;
  timestamp: number;
  isEditing: boolean;
  editingEntryId: number | null;
}

export interface CloudTestimonyEntry {
  id: string;
  account_id: string;
  local_id: string;
  title: string;
  testimony_type: TestimonyType | null;
  struggle: string | null;
  turning_point: string | null;
  outcome: string | null;
  reflection: string | null;
  your_invitation: string | null;
  status: TestimonyStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  deleted: number;
  linked: number;
  errors: string[];
  lastSyncTimestamp: string;
}

// ============================================
// TESTIMONY TYPE METADATA
// ============================================

export const TESTIMONY_TYPES: Array<{
  id: TestimonyType;
  label: string;
  description: string;
}> = [
  { id: 'salvation', label: 'Salvation', description: 'How you came to faith in Jesus' },
  { id: 'healing', label: 'Healing', description: 'Physical, emotional, or spiritual healing' },
  { id: 'provision', label: 'Provision', description: 'God meeting financial, relational, or practical needs' },
  { id: 'breakthrough', label: 'Breakthrough', description: 'Freedom from strongholds, addictions, or lies' },
  { id: 'everyday_faithfulness', label: 'Everyday Faithfulness', description: 'Answered prayers, divine appointments, "God moments"' },
  { id: 'transformation', label: 'Transformation', description: 'How God changed your character, mindset, or behavior' },
  { id: 'relationship_restoration', label: 'Relationship Restoration', description: 'God healing broken relationships' },
  { id: 'direction_guidance', label: 'Direction & Guidance', description: 'God leading you to the right decision or opportunity' },
];

// ============================================
// STORY FRAMEWORK SECTIONS
// ============================================

export const STORY_SECTIONS: Array<{
  key: StorySectionKey;
  letter: string;
  title: string;
  subtitle: string;
  placeholder: string;
}> = [
  {
    key: 'struggle',
    letter: 'S',
    title: 'Struggle',
    subtitle: 'Where were you before God intervened?',
    placeholder: 'Describe the situation, problem, or pain you were experiencing. What did life look like without God\'s intervention? Be specific — details make your story real and relatable.',
  },
  {
    key: 'turningPoint',
    letter: 'T',
    title: 'Turning Point',
    subtitle: 'When and how did God show up?',
    placeholder: 'What specific event, encounter, or realization happened? Be specific — give dates, locations, circumstances. How did you recognize it was God?',
  },
  {
    key: 'outcome',
    letter: 'O',
    title: 'Outcome',
    subtitle: 'What changed as a result?',
    placeholder: 'How is your life different now compared to before? What freedom, healing, or breakthrough did you experience? What changed because God intervened?',
  },
  {
    key: 'reflection',
    letter: 'R',
    title: 'Reflection',
    subtitle: 'What did this teach you about God?',
    placeholder: 'What did this experience reveal about God\'s character? What did it teach you about yourself? How did this grow your faith?',
  },
  {
    key: 'yourInvitation',
    letter: 'Y',
    title: 'Your Invitation',
    subtitle: 'What hope can you offer others?',
    placeholder: 'What do you want others to take away from your story? What hope can you offer them? How can they experience God\'s faithfulness too?',
  },
];

// ============================================
// STORAGE KEYS
// ============================================

export const TESTIMONY_STORAGE_KEYS = {
  TESTIMONIES: 'dna_testimonies',
  DRAFT: 'dna_testimony_draft',
  WELCOME_SEEN: 'dna_testimony_welcome_seen',
  DEVICE_ID: 'ark_device_id', // Shared with journal
} as const;
