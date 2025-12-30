import { NotepadNote, CreateNoteInput, UpdateNoteInput } from '../types';

const API_BASE = '/api/modules/user/notepad/notes';

export const notesService = {
  async getNotes(folderId?: string, groupId?: string | null): Promise<NotepadNote[]> {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    // Only append groupId if it's a valid non-empty string
    if (groupId && groupId.trim() !== '') {
      params.append('groupId', groupId);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  },

  async createNote(note: CreateNoteInput): Promise<NotepadNote> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create note' }));
      throw new Error(errorData.error || 'Failed to create note');
    }
    return response.json();
  },

  async updateNote(id: string, updates: UpdateNoteInput): Promise<NotepadNote> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update note');
    return response.json();
  },

  async deleteNote(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete note');
  },
};


