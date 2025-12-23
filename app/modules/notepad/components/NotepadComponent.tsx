"use client";

import { useState, useEffect, useRef } from 'react';
import { NotepadFolder, NotepadNote, CreateFolderInput, UpdateFolderInput, CreateNoteInput, UpdateNoteInput } from '../types';
import { Plus, Folder, FileText, Trash2, Edit2, X, Check, ArrowLeft, Menu, Sparkles, Loader2, User, Circle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { cn } from '@/lib/utils';
import { aiService, ExtractedTask } from '../services/aiService';
import { tasksService } from '@/app/modules/TaskPlanner/services/tasksService';
import { TaskTypeIcon, TASK_TYPES } from '@/app/modules/TaskPlanner/components/TaskTypeIcon';
import { goalsService } from '@/app/modules/TaskPlanner/services/goalsService';
import { useTasks } from '@/app/modules/TaskPlanner/hooks/useTasks';
import { Goal, Task } from '@/app/modules/TaskPlanner/types';
import Image from 'next/image';

interface NotepadComponentProps {
  folders: NotepadFolder[];
  notes: NotepadNote[];
  loading: boolean;
  error: string | null;
  selectedFolderId?: string;
  onSetSelectedFolderId: (folderId: string | undefined) => void;
  selectedNoteId?: string;
  onSetSelectedNoteId: (noteId: string | undefined) => void;
  selectedNote?: NotepadNote;
  onCreateFolder: (folder: CreateFolderInput) => Promise<void>;
  onUpdateFolder: (id: string, updates: UpdateFolderInput) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  onCreateNote: (note: CreateNoteInput) => Promise<void>;
  onUpdateNote: (id: string, updates: UpdateNoteInput) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  groupId?: string;
}

export function NotepadComponent({
  folders,
  notes,
  loading,
  error,
  selectedFolderId,
  onSetSelectedFolderId,
  selectedNoteId,
  onSetSelectedNoteId,
  selectedNote,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  groupId,
}: NotepadComponentProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'note'>('list');
  const [showFolders, setShowFolders] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<ExtractedTask | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // TaskPlanner integration
  const { tasks: allTasks } = useTasks(groupId);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [selectedTimezone] = useState('America/New_York');
  const [showTypeDropdown, setShowTypeDropdown] = useState<number | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<number | null>(null);

  // Load goals on mount and when groupId changes
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setGoalsLoading(true);
        const goalsData = await goalsService.getGoals(groupId);
        setGoals(goalsData);
      } catch (err) {
        console.error('Failed to load goals:', err);
      } finally {
        setGoalsLoading(false);
      }
    };
    loadGoals();
  }, [groupId]);

  // Initialize note editor when a note is selected
  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteContent(selectedNote.content);
      // On mobile, switch to note view when a note is selected
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMobileView('note');
      }
    } else {
      setNoteTitle('');
      setNoteContent('');
    }
  }, [selectedNote]);

  // Handle note selection - switch to note view on mobile
  const handleNoteSelect = (noteId: string) => {
    onSetSelectedNoteId(noteId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileView('note');
    }
  };

  // Handle back button on mobile
  const handleBackToList = () => {
    setMobileView('list');
    onSetSelectedNoteId(undefined);
  };

  // Auto-save note changes
  useEffect(() => {
    if (!selectedNote || !noteTitle.trim()) return;

    const timeoutId = setTimeout(async () => {
      if (noteTitle !== selectedNote.title || noteContent !== selectedNote.content) {
        setIsSaving(true);
        try {
          await onUpdateNote(selectedNote.id, {
            title: noteTitle,
            content: noteContent,
          });
        } catch (err) {
          console.error('Failed to save note:', err);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [noteTitle, noteContent, selectedNote, onUpdateNote]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await onCreateFolder({
        name: newFolderName.trim(),
        groupId,
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleUpdateFolder = async (id: string) => {
    if (!editingFolderName.trim()) return;
    try {
      await onUpdateFolder(id, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    } catch (err) {
      console.error('Failed to update folder:', err);
    }
  };

  const handleCreateNote = async () => {
    try {
      await onCreateNote({
        title: 'New Note',
        content: '',
        folderId: selectedFolderId,
        groupId,
      });
      // On mobile, switch to note view after creating
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMobileView('note');
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await onDeleteNote(id);
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
    }
  };

  const handleExtractTasks = async () => {
    if (!selectedNote) return;
    
    setIsExtracting(true);
    try {
      const tasks = await aiService.extractTasksFromNote(selectedNote.id);
      setExtractedTasks(tasks);
      setSelectedTasks(new Set(tasks.map((_, index) => index)));
      setShowTaskDialog(true);
    } catch (err) {
      console.error('Failed to extract tasks:', err);
      alert('Failed to extract tasks. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const handleEditTask = (index: number) => {
    const task = extractedTasks[index];
    setEditingTaskIndex(index);
    // Initialize with defaults matching NewTaskForm
    setEditingTask({
      title: task.title || '',
      description: task.description || '',
      date: task.date || '',
      end_date: task.end_date || '',
      time: task.time || '',
      end_time: task.end_time || '',
      type: task.type || (groupId ? 'group' : 'personal'),
      goal_id: task.goal_id || null,
      parent_id: task.parent_id || null,
      priority: task.priority || 'medium',
      is_recurring: task.is_recurring || false,
      recurrence_pattern: task.recurrence_pattern || 'daily',
      recurrence_interval: task.recurrence_interval || 1,
      recurrence_day_of_week: task.recurrence_day_of_week || [],
      recurrence_day_of_month: task.recurrence_day_of_month || [],
      recurrence_month: task.recurrence_month || [],
      recurrence_end_type: task.recurrence_end_type || 'never',
      recurrence_end_date: task.recurrence_end_date || '',
      recurrence_count: task.recurrence_count || 1,
      image_url: task.image_url || null,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !editingTask) return;

    try {
      setIsUploadingImage(index);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setEditingTask({ ...editingTask, image_url: data.secure_url });
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setIsUploadingImage(null);
    }
  };

  const handleSaveTaskEdit = (index: number) => {
    if (!editingTask) return;
    
    const updatedTasks = [...extractedTasks];
    updatedTasks[index] = editingTask;
    setExtractedTasks(updatedTasks);
    setEditingTaskIndex(null);
    setEditingTask(null);
  };

  const handleCancelTaskEdit = () => {
    setEditingTaskIndex(null);
    setEditingTask(null);
  };

  const handleCreateSelectedTasks = async () => {
    if (selectedTasks.size === 0) {
      alert('Please select at least one task to create.');
      return;
    }

    setIsCreatingTasks(true);
    try {
      const tasksToCreate = Array.from(selectedTasks).map(index => extractedTasks[index]);
      
      // Map priority from text to number (high=1, medium=2, low=3)
      const priorityMap: Record<string, number> = {
        high: 1,
        medium: 2,
        low: 3,
      };
      
      // Create all selected tasks using TaskPlanner API with all fields
      await Promise.all(
        tasksToCreate.map(task => {
          const taskDate = task.date 
            ? new Date(task.date + 'T' + (task.time || '12:00') + ':00')
            : new Date();
          
          return tasksService.createTask({
            title: task.title,
            text: task.title, // TaskPlanner uses both title and text
            description: task.description,
            type: task.type || (groupId ? 'group' : 'personal'),
            groupId: groupId || null,
            goalId: task.goal_id || null,
            parentId: task.parent_id || null,
            priority: task.priority ? priorityMap[task.priority] : 2, // Default to medium (2)
            dueDate: task.date 
              ? new Date(task.date + 'T' + (task.time || '12:00') + ':00').toISOString()
              : taskDate.toISOString(),
            endDate: task.end_date 
              ? new Date(task.end_date + 'T' + (task.end_time || '12:00') + ':00').toISOString()
              : undefined,
            timezone: selectedTimezone,
            scheduledTime: task.time || undefined,
            endTime: task.end_time || undefined,
            isRecurring: task.is_recurring || false,
            recurrencePattern: task.recurrence_pattern,
            recurrenceInterval: task.recurrence_interval,
            recurrenceDayOfWeek: task.recurrence_day_of_week,
            recurrenceDayOfMonth: task.recurrence_day_of_month,
            recurrenceMonth: task.recurrence_month,
            recurrenceEndDate: task.recurrence_end_date || undefined,
            recurrenceCount: task.recurrence_count,
            imageUrl: task.image_url,
          });
        })
      );

      // Close dialog and reset state
      setShowTaskDialog(false);
      setExtractedTasks([]);
      setSelectedTasks(new Set());
      alert(`Successfully created ${tasksToCreate.length} task(s)!`);
    } catch (err) {
      console.error('Failed to create tasks:', err);
      alert('Failed to create tasks. Please try again.');
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffTime = now.getTime() - noteDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return noteDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return noteDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return noteDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    }
  };

  const formatFullDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Filter notes by selected folder
  const filteredNotes = selectedFolderId
    ? notes.filter(n => n.folderId === selectedFolderId)
    : notes.filter(n => !n.folderId);

  // Organize filtered notes by date
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const previous7Days: NotepadNote[] = [];
  const previous30Days: NotepadNote[] = [];
  const older: NotepadNote[] = [];

  filteredNotes.forEach(note => {
    const noteDate = new Date(note.updatedAt);
    if (noteDate >= sevenDaysAgo) {
      previous7Days.push(note);
    } else if (noteDate >= thirtyDaysAgo) {
      previous30Days.push(note);
    } else {
      older.push(note);
    }
  });

  const notesByDate = { previous7Days, previous30Days, older };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-background">
      {/* Mobile View - Folders Drawer */}
      {showFolders && (
        <div className="md:hidden fixed inset-0 z-50 bg-background">
          <div className="h-full w-64 border-r bg-muted/30 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Folders</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowFolders(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {/* All Notes (no folder) */}
              <button
                onClick={() => {
                  onSetSelectedFolderId(undefined);
                  setShowFolders(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between hover:bg-accent transition-colors",
                  selectedFolderId === undefined && "bg-accent font-medium"
                )}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>All Notes</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {notes.filter(n => !n.folderId).length}
                </span>
              </button>

              {/* Folders */}
              {folders.map((folder) => (
                <div key={folder.id} className="group">
                  {editingFolderId === folder.id ? (
                    <div className="flex items-center gap-1 px-3 py-2">
                      <Input
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateFolder(folder.id);
                          } else if (e.key === 'Escape') {
                            setEditingFolderId(null);
                            setEditingFolderName('');
                          }
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleUpdateFolder(folder.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingFolderId(null);
                          setEditingFolderName('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onSetSelectedFolderId(folder.id);
                          setShowFolders(false);
                        }}
                        className={cn(
                          "flex-1 text-left px-3 py-2 rounded-md text-sm flex items-center justify-between hover:bg-accent transition-colors",
                          selectedFolderId === folder.id && "bg-accent font-medium"
                        )}
                      >
                        <div className="flex items-center">
                          <Folder className="h-4 w-4 mr-2" />
                          <span>{folder.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {notes.filter(n => n.folderId === folder.id).length}
                        </span>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => {
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => {
                          if (confirm(`Delete folder "${folder.name}"? Notes in this folder will not be deleted.`)) {
                            onDeleteFolder(folder.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {/* Create Folder Input */}
              {isCreatingFolder && (
                <div className="flex items-center gap-1 px-3 py-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFolder();
                      } else if (e.key === 'Escape') {
                        setIsCreatingFolder(false);
                        setNewFolderName('');
                      }
                    }}
                    placeholder="Folder name"
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleCreateFolder}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setIsCreatingFolder(true);
                  setNewFolderName('');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Left Sidebar - Folders */}
      <div className="hidden md:flex w-64 border-r bg-muted/30 flex-col">
        <div className="p-4 border-b">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => setIsCreatingFolder(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* All Notes (no folder) */}
          <button
            onClick={() => onSetSelectedFolderId(undefined)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between hover:bg-accent transition-colors",
              selectedFolderId === undefined && "bg-accent font-medium"
            )}
          >
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span>All Notes</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {notes.filter(n => !n.folderId).length}
            </span>
          </button>

          {/* Folders */}
          {folders.map((folder) => (
            <div key={folder.id} className="group">
              {editingFolderId === folder.id ? (
                <div className="flex items-center gap-1 px-3 py-2">
                  <Input
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateFolder(folder.id);
                      } else if (e.key === 'Escape') {
                        setEditingFolderId(null);
                        setEditingFolderName('');
                      }
                    }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleUpdateFolder(folder.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingFolderId(null);
                      setEditingFolderName('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSetSelectedFolderId(folder.id)}
                    className={cn(
                      "flex-1 text-left px-3 py-2 rounded-md text-sm flex items-center justify-between hover:bg-accent transition-colors",
                      selectedFolderId === folder.id && "bg-accent font-medium"
                    )}
                  >
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2" />
                      <span>{folder.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {notes.filter(n => n.folderId === folder.id).length}
                    </span>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      setEditingFolderId(folder.id);
                      setEditingFolderName(folder.name);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={() => {
                      if (confirm(`Delete folder "${folder.name}"? Notes in this folder will not be deleted.`)) {
                        onDeleteFolder(folder.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Create Folder Input */}
          {isCreatingFolder && (
            <div className="flex items-center gap-1 px-3 py-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  } else if (e.key === 'Escape') {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
                placeholder="Folder name"
                className="h-8 text-sm"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleCreateFolder}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Notes List View */}
      {mobileView === 'list' && (
        <div className="md:hidden flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowFolders(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold">
                {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name || 'Notes' : 'All Notes'}
              </h2>
            </div>
            <Button size="icon" variant="outline" onClick={handleCreateNote}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notesByDate.previous7Days.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Previous 7 Days</div>
                {notesByDate.previous7Days.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleNoteSelect(note.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors mb-1",
                      selectedNoteId === note.id && "bg-accent"
                    )}
                  >
                    <div className="font-medium text-sm truncate">{note.title}</div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {note.content.substring(0, 50) || 'No additional content'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{formatDate(note.updatedAt)}</div>
                  </button>
                ))}
              </div>
            )}

            {notesByDate.previous30Days.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Previous 30 Days</div>
                {notesByDate.previous30Days.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleNoteSelect(note.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors mb-1",
                      selectedNoteId === note.id && "bg-accent"
                    )}
                  >
                    <div className="font-medium text-sm truncate">{note.title}</div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {note.content.substring(0, 50) || 'No additional content'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{formatDate(note.updatedAt)}</div>
                  </button>
                ))}
              </div>
            )}

            {notesByDate.older.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Older</div>
                {notesByDate.older.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleNoteSelect(note.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors mb-1",
                      selectedNoteId === note.id && "bg-accent"
                    )}
                  >
                    <div className="font-medium text-sm truncate">{note.title}</div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {note.content.substring(0, 50) || 'No additional content'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{formatDate(note.updatedAt)}</div>
                  </button>
                ))}
              </div>
            )}

            {filteredNotes.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notes yet</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleCreateNote}>
                    Create your first note
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop: Middle Column - Notes List */}
      <div className="hidden md:flex w-80 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">
            {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name || 'Notes' : 'All Notes'}
          </h2>
          <Button size="icon" variant="outline" onClick={handleCreateNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notesByDate.previous7Days.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Previous 7 Days</div>
              {notesByDate.previous7Days.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleNoteSelect(note.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors mb-1",
                    selectedNoteId === note.id && "bg-accent"
                  )}
                >
                  <div className="font-medium text-sm truncate">{note.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {note.content.substring(0, 50) || 'No additional content'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(note.updatedAt)}</div>
                </button>
              ))}
            </div>
          )}

          {notesByDate.previous30Days.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Previous 30 Days</div>
              {notesByDate.previous30Days.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleNoteSelect(note.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors mb-1",
                    selectedNoteId === note.id && "bg-accent"
                  )}
                >
                  <div className="font-medium text-sm truncate">{note.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {note.content.substring(0, 50) || 'No additional content'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(note.updatedAt)}</div>
                </button>
              ))}
            </div>
          )}

          {notesByDate.older.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Older</div>
              {notesByDate.older.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleNoteSelect(note.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors mb-1",
                    selectedNoteId === note.id && "bg-accent"
                  )}
                >
                  <div className="font-medium text-sm truncate">{note.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {note.content.substring(0, 50) || 'No additional content'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(note.updatedAt)}</div>
                </button>
              ))}
            </div>
          )}

          {filteredNotes.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleCreateNote}>
                  Create your first note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Note Editor View */}
      {mobileView === 'note' && (
        <div className="md:hidden flex-1 flex flex-col bg-background">
          {selectedNote ? (
            <>
              <div className="p-4 border-b flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {formatFullDate(selectedNote.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleExtractTasks}
                    disabled={isExtracting}
                    title="Extract tasks from note"
                  >
                    {isExtracting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 flex flex-col p-4 overflow-hidden bg-white">
                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="text-xl font-semibold mb-4 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  placeholder="New Note"
                />
                <Textarea
                  ref={contentTextareaRef}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base"
                  placeholder="Start writing..."
                />
                {isSaving && (
                  <div className="text-xs text-muted-foreground mt-2">Saving...</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground bg-white">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">New Note</p>
                <p className="text-sm italic">Start writing...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop: Right Column - Note Editor */}
      <div className="hidden md:flex flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {formatFullDate(selectedNote.updatedAt)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleExtractTasks}
                  disabled={isExtracting}
                  title="Extract tasks from note"
                >
                  {isExtracting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="text-xl font-semibold mb-4 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Note title"
              />
              <Textarea
                ref={contentTextareaRef}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Start writing..."
              />
              {isSaving && (
                <div className="text-xs text-muted-foreground mt-2">Saving...</div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Select a note to view</p>
              <p className="text-sm">or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Task Extraction Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Extract Tasks from Note</DialogTitle>
            <DialogDescription>
              Select which tasks you'd like to create. Uncheck any tasks you don't want to add.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {extractedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks found in this note.</p>
              </div>
            ) : (
              extractedTasks.map((task, index) => {
                const taskType = task.type || (groupId ? 'group' : 'personal');
                const taskDate = task.date ? new Date(task.date) : new Date();
                const dateStr = taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const isEditing = editingTaskIndex === index;
                const currentTask = isEditing && editingTask ? editingTask : task;
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "bg-white rounded-xl border-2 p-4 transition-all",
                      selectedTasks.has(index)
                        ? "border-indigo-300 hover:border-indigo-400"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Left side: Icon and Date */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: TASK_TYPES[taskType.toUpperCase()]?.bgColor || '#F9F5FF' }}
                        >
                          <TaskTypeIcon type={taskType} className="h-5 w-5" />
                        </div>
                        {!isEditing && (
                          <div className="text-xs text-muted-foreground mt-1">{dateStr}</div>
                        )}
                      </div>

                      {/* Middle: Task content */}
                      <div className="flex-1 min-w-0" onClick={(e) => !isEditing && handleToggleTask(index)}>
                        {isEditing ? (
                          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                              <Input
                                value={editingTask?.title || ''}
                                onChange={(e) => {
                                  if (editingTask) {
                                    setEditingTask({ ...editingTask, title: e.target.value });
                                  }
                                }}
                                placeholder="Task title"
                                className="text-sm"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                              <Textarea
                                value={editingTask?.description || ''}
                                onChange={(e) => {
                                  if (editingTask) {
                                    setEditingTask({ ...editingTask, description: e.target.value });
                                  }
                                }}
                                placeholder="Description (optional)"
                                className="text-sm min-h-[60px]"
                                rows={3}
                              />
                            </div>

                            {/* Image Upload */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Image</label>
                              <div className="flex items-center gap-4">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, index)}
                                  className="hidden"
                                  id={`image-upload-${index}`}
                                  disabled={isUploadingImage === index}
                                />
                                <label
                                  htmlFor={`image-upload-${index}`}
                                  className={`px-3 py-1.5 text-xs border rounded cursor-pointer ${
                                    isUploadingImage === index ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  {isUploadingImage === index ? 'Uploading...' : 'Upload Image'}
                                </label>
                                {editingTask?.image_url && (
                                  <div className="relative w-16 h-16">
                                    <Image
                                      src={editingTask.image_url}
                                      alt="Task"
                                      className="object-cover rounded"
                                      fill
                                      sizes="64px"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editingTask) {
                                          setEditingTask({ ...editingTask, image_url: null });
                                        }
                                      }}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Date and Time */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                <Input
                                  type="date"
                                  value={editingTask?.date || ''}
                                  onChange={(e) => {
                                    if (editingTask) {
                                      setEditingTask({ ...editingTask, date: e.target.value });
                                    }
                                  }}
                                  className="text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                                <Input
                                  type="time"
                                  value={editingTask?.time || ''}
                                  onChange={(e) => {
                                    if (editingTask) {
                                      setEditingTask({ ...editingTask, time: e.target.value });
                                    }
                                  }}
                                  className="text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                                <Input
                                  type="date"
                                  value={editingTask?.end_date || ''}
                                  onChange={(e) => {
                                    if (editingTask) {
                                      setEditingTask({ ...editingTask, end_date: e.target.value });
                                    }
                                  }}
                                  className="text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                                <Input
                                  type="time"
                                  value={editingTask?.end_time || ''}
                                  onChange={(e) => {
                                    if (editingTask) {
                                      setEditingTask({ ...editingTask, end_time: e.target.value });
                                    }
                                  }}
                                  className="text-xs"
                                />
                              </div>
                            </div>

                            {/* Goal and Parent Task */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Goal</label>
                                <select
                                  className="w-full p-1.5 text-xs border rounded"
                                  value={editingTask?.goal_id || ''}
                                  onChange={(e) => {
                                    if (editingTask) {
                                      setEditingTask({
                                        ...editingTask,
                                        goal_id: e.target.value === '' ? null : e.target.value,
                                      });
                                    }
                                  }}
                                >
                                  <option value="">No Goal</option>
                                  {goals.slice().sort((a, b) => {
                                    const textA = a.goal || '';
                                    const textB = b.goal || '';
                                    return textA.localeCompare(textB);
                                  }).map(goal => (
                                    <option key={goal.id} value={goal.id}>
                                      {goal.goal || ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Parent Task</label>
                                <select
                                  className="w-full p-1.5 text-xs border rounded"
                                  value={editingTask?.parent_id || ''}
                                  onChange={(e) => {
                                    if (editingTask) {
                                      setEditingTask({
                                        ...editingTask,
                                        parent_id: e.target.value === '' ? null : e.target.value,
                                      });
                                    }
                                  }}
                                >
                                  <option value="">No Parent Task</option>
                                  {allTasks.slice()
                                    .sort((a, b) => {
                                      const textA = a.text || a.title || '';
                                      const textB = b.text || b.title || '';
                                      return textA.localeCompare(textB);
                                    })
                                    .map(task => (
                                      <option key={task.id} value={task.id}>
                                        {task.text || task.title || ''}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            {/* Type */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                              <div className="relative">
                                <button
                                  type="button"
                                  className={`flex items-center gap-2 w-full p-1.5 rounded-lg border text-xs ${
                                    showTypeDropdown === index ? 'ring-2 ring-offset-1 ring-blue-500' : 'hover:bg-gray-50'
                                  }`}
                                  style={{ backgroundColor: TASK_TYPES[(editingTask?.type || 'personal').toUpperCase()]?.bgColor || 'white' }}
                                  onClick={() => setShowTypeDropdown(showTypeDropdown === index ? null : index)}
                                >
                                  {(() => {
                                    const Icon = TASK_TYPES[(editingTask?.type || 'personal').toUpperCase()]?.icon;
                                    return Icon ? <Icon className={`w-4 h-4 ${TASK_TYPES[(editingTask?.type || 'personal').toUpperCase()]?.className}`} /> : null;
                                  })()}
                                  <span>{TASK_TYPES[(editingTask?.type || 'personal').toUpperCase()]?.label || editingTask?.type}</span>
                                  <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {showTypeDropdown === index && (
                                  <div
                                    className="absolute left-0 top-full mt-1 w-full rounded-lg shadow-lg border z-50 bg-white"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="grid grid-cols-3 gap-1 p-1">
                                      {Object.entries(TASK_TYPES).map(([key, value]) => (
                                        <button
                                          key={key}
                                          type="button"
                                          className="flex flex-col items-center gap-1 w-full px-2 py-2 hover:bg-gray-50 rounded"
                                          style={{ backgroundColor: value.bgColor }}
                                          onClick={() => {
                                            if (editingTask) {
                                              setEditingTask({ ...editingTask, type: key.toLowerCase() });
                                            }
                                            setShowTypeDropdown(null);
                                          }}
                                        >
                                          <value.icon className={`w-4 h-4 ${value.className}`} />
                                          <span className="text-xs text-center">{value.label || key}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Priority */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                              <select
                                value={editingTask?.priority || 'medium'}
                                onChange={(e) => {
                                  if (editingTask) {
                                    setEditingTask({
                                      ...editingTask,
                                      priority: e.target.value as 'low' | 'medium' | 'high',
                                    });
                                  }
                                }}
                                className="w-full p-1.5 text-xs border rounded"
                              >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                              </select>
                            </div>

                            {/* Recurring Task */}
                            <div className="border-t pt-2 mt-2">
                              <div className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  id={`isRecurring-${index}`}
                                  checked={editingTask?.is_recurring || false}
                                  onChange={(e) => {
                                    if (editingTask) {
                                      setEditingTask({ ...editingTask, is_recurring: e.target.checked });
                                    }
                                  }}
                                  className="mr-2 h-3 w-3"
                                />
                                <label htmlFor={`isRecurring-${index}`} className="text-xs font-medium">
                                  Recurring task
                                </label>
                              </div>

                              {editingTask?.is_recurring && (
                                <div className="pl-4 space-y-2 border-l-2 border-blue-100">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Repeat</label>
                                    <div className="flex gap-2">
                                      <select
                                        value={editingTask.recurrence_interval || 1}
                                        onChange={(e) => {
                                          if (editingTask) {
                                            setEditingTask({ ...editingTask, recurrence_interval: parseInt(e.target.value) });
                                          }
                                        }}
                                        className="p-1 text-xs border rounded w-20"
                                      >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                          <option key={num} value={num}>Every {num}</option>
                                        ))}
                                      </select>
                                      <select
                                        value={editingTask.recurrence_pattern || 'daily'}
                                        onChange={(e) => {
                                          if (editingTask) {
                                            setEditingTask({ ...editingTask, recurrence_pattern: e.target.value });
                                          }
                                        }}
                                        className="p-1 text-xs border rounded flex-grow"
                                      >
                                        <option value="daily">Day(s)</option>
                                        <option value="weekly">Week(s)</option>
                                        <option value="monthly">Month(s)</option>
                                        <option value="yearly">Year(s)</option>
                                      </select>
                                    </div>
                                  </div>

                                  {editingTask.recurrence_pattern === 'weekly' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">On these days</label>
                                      <div className="grid grid-cols-7 gap-1">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, dayIndex) => (
                                          <button
                                            key={dayIndex}
                                            type="button"
                                            className={`
                                              p-1 rounded-full w-6 h-6 flex items-center justify-center text-xs
                                              ${(editingTask.recurrence_day_of_week || []).includes(dayIndex)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                                            `}
                                            onClick={() => {
                                              if (editingTask) {
                                                const newDays = (editingTask.recurrence_day_of_week || []).includes(dayIndex)
                                                  ? (editingTask.recurrence_day_of_week || []).filter(d => d !== dayIndex)
                                                  : [...(editingTask.recurrence_day_of_week || []), dayIndex];
                                                setEditingTask({ ...editingTask, recurrence_day_of_week: newDays });
                                              }
                                            }}
                                          >
                                            {day}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {editingTask.recurrence_pattern === 'monthly' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">On day of month</label>
                                      <select
                                        value={(editingTask.recurrence_day_of_month || [])[0] || 1}
                                        onChange={(e) => {
                                          if (editingTask) {
                                            const day = parseInt(e.target.value);
                                            setEditingTask({ ...editingTask, recurrence_day_of_month: [day] });
                                          }
                                        }}
                                        className="p-1 text-xs border rounded"
                                      >
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                          <option key={day} value={day}>{day}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {editingTask.recurrence_pattern === 'yearly' && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                                        <select
                                          value={(editingTask.recurrence_month || [])[0] || 0}
                                          onChange={(e) => {
                                            if (editingTask) {
                                              const month = parseInt(e.target.value);
                                              setEditingTask({ ...editingTask, recurrence_month: [month] });
                                            }
                                          }}
                                          className="p-1 text-xs border rounded w-full"
                                        >
                                          {['January', 'February', 'March', 'April', 'May', 'June', 'July',
                                            'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                                            <option key={idx} value={idx}>{month}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                                        <select
                                          value={(editingTask.recurrence_day_of_month || [])[0] || 1}
                                          onChange={(e) => {
                                            if (editingTask) {
                                              const day = parseInt(e.target.value);
                                              setEditingTask({ ...editingTask, recurrence_day_of_month: [day] });
                                            }
                                          }}
                                          className="p-1 text-xs border rounded w-full"
                                        >
                                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>{day}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Ends</label>
                                    <div className="space-y-1">
                                      <div className="flex items-center">
                                        <input
                                          type="radio"
                                          id={`endNever-${index}`}
                                          checked={editingTask.recurrence_end_type === 'never'}
                                          onChange={() => {
                                            if (editingTask) {
                                              setEditingTask({ ...editingTask, recurrence_end_type: 'never' });
                                            }
                                          }}
                                          className="mr-2"
                                        />
                                        <label htmlFor={`endNever-${index}`} className="text-xs">Never</label>
                                      </div>
                                      <div className="flex items-center">
                                        <input
                                          type="radio"
                                          id={`endOnDate-${index}`}
                                          checked={editingTask.recurrence_end_type === 'on_date'}
                                          onChange={() => {
                                            if (editingTask) {
                                              setEditingTask({ ...editingTask, recurrence_end_type: 'on_date' });
                                            }
                                          }}
                                          className="mr-2"
                                        />
                                        <label htmlFor={`endOnDate-${index}`} className="text-xs">On date</label>
                                        {editingTask.recurrence_end_type === 'on_date' && (
                                          <Input
                                            type="date"
                                            value={editingTask.recurrence_end_date || ''}
                                            onChange={(e) => {
                                              if (editingTask) {
                                                setEditingTask({ ...editingTask, recurrence_end_date: e.target.value });
                                              }
                                            }}
                                            className="ml-2 p-1 text-xs border rounded"
                                          />
                                        )}
                                      </div>
                                      <div className="flex items-center">
                                        <input
                                          type="radio"
                                          id={`endAfter-${index}`}
                                          checked={editingTask.recurrence_end_type === 'after_occurrences'}
                                          onChange={() => {
                                            if (editingTask) {
                                              setEditingTask({ ...editingTask, recurrence_end_type: 'after_occurrences' });
                                            }
                                          }}
                                          className="mr-2"
                                        />
                                        <label htmlFor={`endAfter-${index}`} className="text-xs">After</label>
                                        {editingTask.recurrence_end_type === 'after_occurrences' && (
                                          <>
                                            <Input
                                              type="number"
                                              value={editingTask.recurrence_count || 1}
                                              onChange={(e) => {
                                                if (editingTask) {
                                                  setEditingTask({ ...editingTask, recurrence_count: parseInt(e.target.value) });
                                                }
                                              }}
                                              min="1"
                                              className="ml-2 p-1 text-xs border rounded w-12"
                                            />
                                            <span className="ml-1 text-xs">occurrences</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Save/Cancel buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveTaskEdit(index);
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelTaskEdit();
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-medium text-slate-800 cursor-pointer">{currentTask.title}</h4>
                            {currentTask.description && (
                              <p className="text-sm text-slate-600 mt-1">{currentTask.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {currentTask.priority && (
                                <span
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-medium rounded border",
                                    currentTask.priority === 'high' && "bg-red-100 text-red-700 border-red-200",
                                    currentTask.priority === 'medium' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                    currentTask.priority === 'low' && "bg-green-100 text-green-700 border-green-200"
                                  )}
                                >
                                  {currentTask.priority}
                                </span>
                              )}
                              {currentTask.date && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(currentTask.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {currentTask.time && ` at ${currentTask.time}`}
                                </span>
                              )}
                              {currentTask.is_recurring && (
                                <span className="text-xs text-blue-600">Recurring</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right side: Edit button and Checkbox */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {!isEditing && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTask(index);
                            }}
                            title="Edit task"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {!isEditing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTask(index);
                            }}
                            className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                              selectedTasks.has(index)
                                ? "bg-indigo-600 border-indigo-600"
                                : "border-slate-300 hover:border-indigo-500"
                            )}
                          >
                            {selectedTasks.has(index) && <Check size={14} className="text-white" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTaskDialog(false);
                setExtractedTasks([]);
                setSelectedTasks(new Set());
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSelectedTasks}
              disabled={selectedTasks.size === 0 || isCreatingTasks}
            >
              {isCreatingTasks ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${selectedTasks.size} Task${selectedTasks.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

