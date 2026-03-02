// ============================================
// Groups & Chat Types
// ============================================

// --- Group Info (for groups list) ---

export interface GroupInfo {
  id: string;
  groupName: string;
  currentPhase: string;
  startDate: string;
  leaderName: string;
  coLeaderName: string | null;
  memberCount: number;
  lastMessage: GroupMessage | null;
  unreadCount: number;
}

// --- Group Members ---

export type MemberRole = 'leader' | 'co_leader' | 'disciple';

export interface GroupMember {
  accountId: string;
  discipleId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  joinedDate: string;
}

// --- Messages ---

export type MessageType =
  | 'text'
  | 'shared_journal'
  | 'shared_testimony'
  | 'shared_prayer_card'
  | 'image'
  | 'gif'
  | 'event';

export type SharedContentType = 'journal' | 'testimony' | 'prayer_card';

export interface SharedContent {
  type: SharedContentType;
  title: string;
  preview: string;
  entryLocalId: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderAccountId: string;
  senderName: string;
  content: string | null;
  messageType: MessageType;
  sharedContent: SharedContent | null;
  mediaUrl: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

// --- Database row shapes (snake_case from Supabase) ---

export interface DbGroupMessage {
  id: string;
  group_id: string;
  sender_account_id: string;
  sender_name: string;
  content: string | null;
  message_type: string;
  shared_content: SharedContent | null;
  media_url: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Helpers ---

export function dbMessageToGroupMessage(row: DbGroupMessage): GroupMessage {
  return {
    id: row.id,
    groupId: row.group_id,
    senderAccountId: row.sender_account_id,
    senderName: row.sender_name,
    content: row.content,
    messageType: row.message_type as MessageType,
    sharedContent: row.shared_content,
    mediaUrl: row.media_url,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
  };
}

export const MESSAGES_PER_PAGE = 50;
