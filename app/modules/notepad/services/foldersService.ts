import { NotepadFolder, CreateFolderInput, UpdateFolderInput } from '../types';

const API_BASE = '/api/modules/user/notepad/folders';

export const foldersService = {
  async getFolders(groupId?: string | null): Promise<NotepadFolder[]> {
    const params = new URLSearchParams();
    // Only append groupId if it's a valid non-empty string
    if (groupId && groupId.trim() !== '') {
      params.append('groupId', groupId);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch folders');
    return response.json();
  },

  async createFolder(folder: CreateFolderInput): Promise<NotepadFolder> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folder),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create folder' }));
      throw new Error(errorData.error || 'Failed to create folder');
    }
    return response.json();
  },

  async updateFolder(id: string, updates: UpdateFolderInput): Promise<NotepadFolder> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update folder');
    return response.json();
  },

  async deleteFolder(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete folder');
  },
};


