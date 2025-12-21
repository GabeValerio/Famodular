import { CheckIn, Question, FamilyMember } from '../types';

const API_BASE = '/api/modules/group/checkins';

export const checkInsService = {
  async getCheckIns(groupId: string): Promise<CheckIn[]> {
    const response = await fetch(`${API_BASE}?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch check-ins');
    return response.json();
  },

  async createCheckIn(checkIn: Omit<CheckIn, 'id' | 'timestamp'>): Promise<CheckIn> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkIn),
    });
    if (!response.ok) throw new Error('Failed to create check-in');
    return response.json();
  },

  async getMembers(groupId: string): Promise<FamilyMember[]> {
    const response = await fetch(`${API_BASE}/members?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  },

  async getQuestions(groupId: string): Promise<Question[]> {
    const response = await fetch(`${API_BASE}/questions?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    return response.json();
  },

  async createQuestion(question: Omit<Question, 'id' | 'timestamp'>): Promise<Question> {
    const response = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!response.ok) throw new Error('Failed to create question');
    return response.json();
  },
};
