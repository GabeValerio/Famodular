// Module-specific types for Chat
import { Message, FamilyMember } from '@/types/family';

export type { Message, FamilyMember };

export interface ChatMessage extends Message {
  isRead?: boolean;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  messageId: string;
  memberId: string;
  emoji: string;
  timestamp: Date;
}
