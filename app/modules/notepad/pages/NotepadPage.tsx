"use client";

import { useNotepad } from '../hooks/useNotepad';
import { NotepadComponent } from '../components/NotepadComponent';
import { useGroup } from '@/lib/GroupContext';
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';
import { CreateFolderInput, UpdateFolderInput, CreateNoteInput, UpdateNoteInput } from '../types';

export function NotepadPage() {
  const { currentGroup, isSelfView } = useGroup();
  const { enabled, AccessDenied } = useModuleAccess('notepad');
  
  // CRITICAL: Pass undefined for self view, groupId for group view (never empty string)
  // This ensures proper data isolation in the API
  const groupId = isSelfView || !currentGroup ? undefined : currentGroup.id;
  
  const {
    folders,
    notes,
    loading,
    error,
    selectedFolderId,
    setSelectedFolderId,
    selectedNoteId,
    setSelectedNoteId,
    selectedNote,
    createFolder: createFolderRaw,
    updateFolder: updateFolderRaw,
    deleteFolder,
    createNote: createNoteRaw,
    updateNote: updateNoteRaw,
    deleteNote,
  } = useNotepad(groupId);

  // If module is disabled, show access denied screen
  if (!enabled && AccessDenied) {
    return <AccessDenied />;
  }

  // Wrap functions to match component prop types (Promise<void>)
  const createFolder = async (folder: CreateFolderInput) => {
    await createFolderRaw(folder);
  };
  
  const updateFolder = async (id: string, updates: UpdateFolderInput) => {
    await updateFolderRaw(id, updates);
  };
  
  const createNote = async (note: CreateNoteInput) => {
    await createNoteRaw(note);
  };
  
  const updateNote = async (id: string, updates: UpdateNoteInput) => {
    await updateNoteRaw(id, updates);
  };

  return (
    <NotepadComponent
      folders={folders}
      notes={notes}
      loading={loading}
      error={error}
      selectedFolderId={selectedFolderId}
      onSetSelectedFolderId={setSelectedFolderId}
      selectedNoteId={selectedNoteId}
      onSetSelectedNoteId={setSelectedNoteId}
      selectedNote={selectedNote}
      onCreateFolder={createFolder}
      onUpdateFolder={updateFolder}
      onDeleteFolder={deleteFolder}
      onCreateNote={createNote}
      onUpdateNote={updateNote}
      onDeleteNote={deleteNote}
      groupId={groupId}
    />
  );
}

