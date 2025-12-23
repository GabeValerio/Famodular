import { useState, useEffect } from 'react';
import { foldersService } from '../services/foldersService';
import { notesService } from '../services/notesService';
import { NotepadFolder, NotepadNote, CreateFolderInput, UpdateFolderInput, CreateNoteInput, UpdateNoteInput } from '../types';

export function useNotepad(groupId?: string) {
  const [folders, setFolders] = useState<NotepadFolder[]>([]);
  const [notes, setNotes] = useState<NotepadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);

  // Fetch initial data
  useEffect(() => {
    loadData();
  }, [groupId, selectedFolderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [foldersData, notesData] = await Promise.all([
        foldersService.getFolders(groupId),
        notesService.getNotes(selectedFolderId, groupId),
      ]);
      setFolders(foldersData);
      setNotes(notesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Folder management
  const createFolder = async (folder: CreateFolderInput) => {
    try {
      const newFolder = await foldersService.createFolder(folder);
      setFolders(prev => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
      return newFolder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
      throw err;
    }
  };

  const updateFolder = async (id: string, updates: UpdateFolderInput) => {
    try {
      const updatedFolder = await foldersService.updateFolder(id, updates);
      setFolders(prev => prev.map(f => f.id === id ? updatedFolder : f).sort((a, b) => a.name.localeCompare(b.name)));
      return updatedFolder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update folder');
      throw err;
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      await foldersService.deleteFolder(id);
      setFolders(prev => prev.filter(f => f.id !== id));
      // If the deleted folder was selected, clear selection
      if (selectedFolderId === id) {
        setSelectedFolderId(undefined);
      }
      // Reload notes to update folder references
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
      throw err;
    }
  };

  // Note management
  const createNote = async (note: CreateNoteInput) => {
    try {
      const newNote = await notesService.createNote(note);
      setNotes(prev => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      return newNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      throw err;
    }
  };

  const updateNote = async (id: string, updates: UpdateNoteInput) => {
    try {
      const updatedNote = await notesService.updateNote(id, updates);
      setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
      return updatedNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      throw err;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await notesService.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      // If the deleted note was selected, clear selection
      if (selectedNoteId === id) {
        setSelectedNoteId(undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      throw err;
    }
  };

  // Get selected note
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return {
    folders,
    notes,
    loading,
    error,
    selectedFolderId,
    setSelectedFolderId,
    selectedNoteId,
    setSelectedNoteId,
    selectedNote,
    createFolder,
    updateFolder,
    deleteFolder,
    createNote,
    updateNote,
    deleteNote,
    refreshData: loadData,
  };
}

