"use client";

import { useChat } from '../hooks/useChat';
import { ChatComponent } from '../components/ChatComponent';

export function ChatPage({ groupId }: { groupId: string }) {
  const {
    messages,
    members,
    loading,
    error,
    sendMessage,
    deleteMessage,
  } = useChat(groupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  // Get current user from members (in real app, get from session)
  const currentUser = members[0] || { id: '', name: '', avatar: '', role: 'Parent' as const };

  return (
    <ChatComponent
      messages={messages}
      members={members}
      currentUser={currentUser}
      onSendMessage={(text) => sendMessage(text, currentUser.id)}
      onDeleteMessage={deleteMessage}
    />
  );
}
