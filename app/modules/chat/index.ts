// Public API
export { ChatPage } from './pages/ChatPage';
export { ChatComponent } from './components/ChatComponent';
export { useChat } from './hooks/useChat';
export type { Message, FamilyMember, ChatMessage, MessageReaction } from './types';
export { chatService } from './services/chatService';

// Register dashboard widgets
import './widgets';
