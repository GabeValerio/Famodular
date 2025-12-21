import { Message } from '../types';

const API_BASE = '/api/modules/group/chat';

export const chatService = {
  async getMessages(groupId: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE}?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async deleteMessage(messageId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${messageId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete message');
  },
};
