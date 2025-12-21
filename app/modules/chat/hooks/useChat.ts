import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';
import { Message, FamilyMember } from '../types';

export function useChat(groupId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const messagesData = await chatService.getMessages(groupId);
      setMessages(messagesData);
      // TODO: Load members from a shared service
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string, senderId: string): Promise<void> => {
    try {
      const newMessage = await chatService.sendMessage({
        senderId,
        groupId,
        text,
      });
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      throw err;
    }
  };

  return {
    messages,
    members,
    loading,
    error,
    sendMessage,
    deleteMessage,
    refresh: loadData,
  };
}
