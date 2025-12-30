// Module-specific types for Notepad
export interface NotepadFolder {
  id: string;
  name: string;
  userId: string;
  groupId?: string; // NULL for personal folders, UUID for group folders
  createdAt: Date;
  updatedAt: Date;
}

export interface NotepadNote {
  id: string;
  title: string;
  content: string;
  folderId?: string; // Optional folder assignment
  userId: string;
  groupId?: string; // NULL for personal notes, UUID for group notes
  createdAt: Date;
  updatedAt: Date;
}

export type CreateFolderInput = Omit<NotepadFolder, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  userId?: string; // Optional, will be set by API
};

export type UpdateFolderInput = Partial<Omit<NotepadFolder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export type CreateNoteInput = Omit<NotepadNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  userId?: string; // Optional, will be set by API
};

export type UpdateNoteInput = Partial<Omit<NotepadNote, 'id' | 'createdAt' | 'updatedAt'>>;


