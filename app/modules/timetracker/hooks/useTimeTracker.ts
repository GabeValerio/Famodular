'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TimeTrackerProject,
  TimeTrackerEntry,
  TimeStats,
  TrackingState,
  CreateProjectInput,
  CreateEntryInput,
  UpdateEntryInput,
} from '../types';
import { ProjectsService, EntriesService } from '../services';

interface UseTimeTrackerProps {
  groupId?: string;
}

export function useTimeTracker({ groupId }: UseTimeTrackerProps = {}) {
  // Data state
  const [projects, setProjects] = useState<TimeTrackerProject[]>([]);
  const [entries, setEntries] = useState<TimeTrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tracking state
  const [trackingState, setTrackingState] = useState<TrackingState>({
    isTracking: false,
    startTime: null,
    currentTime: new Date(),
    description: '',
    selectedProjectId: undefined,
  });

  // Refs for interval management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsData, entriesData] = await Promise.all([
        ProjectsService.getProjects(groupId),
        EntriesService.getEntries(groupId),
      ]);

      setProjects(projectsData);
      setEntries(entriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Initialize data loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time timer updates
  useEffect(() => {
    if (trackingState.isTracking) {
      intervalRef.current = setInterval(() => {
        setTrackingState(prev => ({
          ...prev,
          currentTime: new Date(),
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [trackingState.isTracking]);

  // Calculate elapsed time
  const calculateElapsedTime = useCallback(() => {
    if (!trackingState.startTime) return 0;
    return Math.floor((trackingState.currentTime.getTime() - trackingState.startTime.getTime()) / 1000);
  }, [trackingState.startTime, trackingState.currentTime]);

  // Format duration helpers
  const formatDuration = useCallback((minutes: number): string => {
    if (!minutes || minutes <= 0) return '0:00';

    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    return `${mins}m`;
  }, []);

  const formatDurationWithSeconds = useCallback((seconds: number): string => {
    if (!seconds || seconds <= 0) return '0:00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Tracking functions
  const startTracking = useCallback(async (description?: string, projectId?: string) => {
    const startTime = new Date();
    setTrackingState({
      isTracking: true,
      startTime,
      currentTime: startTime,
      description: description || '',
      selectedProjectId: projectId,
    });
  }, []);

  const stopTracking = useCallback(async (): Promise<TimeTrackerEntry | null> => {
    if (!trackingState.isTracking || !trackingState.startTime) return null;

    try {
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - trackingState.startTime.getTime()) / (1000 * 60));

      const entry: CreateEntryInput = {
        startTime: trackingState.startTime,
        endTime,
        description: trackingState.description,
        projectId: trackingState.selectedProjectId,
        groupId,
      };

      const newEntry = await EntriesService.createEntry(entry);

      // Reset tracking state
      setTrackingState({
        isTracking: false,
        startTime: null,
        currentTime: new Date(),
        description: '',
        selectedProjectId: undefined,
      });

      // Add to entries list
      setEntries(prev => [newEntry, ...prev]);

      return newEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
      return null;
    }
  }, [trackingState, groupId]);

  // Project management
  const createProject = useCallback(async (project: CreateProjectInput): Promise<TimeTrackerProject> => {
    try {
      const newProject = await ProjectsService.createProject({
        ...project,
        groupId,
      });
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  }, [groupId]);

  const updateProject = useCallback(async (id: string, updates: Partial<TimeTrackerProject>): Promise<void> => {
    try {
      await ProjectsService.updateProject(id, updates);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      await ProjectsService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      // Also remove project from entries
      setEntries(prev => prev.map(e => e.projectId === id ? { ...e, projectId: undefined, project: undefined } : e));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  }, []);

  // Entry management
  const createManualEntry = useCallback(async (entry: CreateEntryInput): Promise<TimeTrackerEntry> => {
    try {
      const newEntry = await EntriesService.createEntry({
        ...entry,
        groupId,
      });
      setEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
      throw err;
    }
  }, [groupId]);

  const updateEntry = useCallback(async (id: string, updates: UpdateEntryInput): Promise<void> => {
    try {
      const updatedEntry = await EntriesService.updateEntry(id, updates);
      setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      throw err;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    try {
      await EntriesService.deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      throw err;
    }
  }, []);

  // Statistics calculations
  const calculateStats = useCallback((): TimeStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

    const todayEntries = entries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= today && entry.endTime;
    });

    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= weekStart && entry.endTime;
    });

    const totalMinutesToday = todayEntries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);
    const totalMinutesThisWeek = weekEntries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);
    const totalMinutesThisMonth = entries
      .filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate.getMonth() === now.getMonth() &&
               entryDate.getFullYear() === now.getFullYear() &&
               entry.endTime;
      })
      .reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);

    const totalMinutesAll = entries
      .filter(entry => entry.endTime)
      .reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);

    const workingDays = Math.max(1, Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)));
    const averageDailyMinutes = Math.floor(totalMinutesAll / workingDays);

    return {
      totalMinutesToday,
      totalMinutesThisWeek,
      totalMinutesThisMonth,
      averageDailyMinutes,
    };
  }, [entries]);

  // Get monthly chart data
  const getMonthlyChartData = useCallback(() => {
    const monthlyData: { [key: string]: number } = {};

    entries.forEach(entry => {
      if (!entry.endTime) return;

      const date = new Date(entry.startTime);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (entry.durationMinutes || 0);
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a + ' 1').getTime() - new Date(b + ' 1').getTime())
      .slice(-12) // Last 12 months
      .map(([month, minutes]) => ({
        month,
        hours: Math.round((minutes / 60) * 10) / 10, // Round to 1 decimal place
        minutes,
      }));
  }, [entries]);

  // Update tracking state from component
  const updateTrackingState = useCallback((updates: Partial<TrackingState>) => {
    setTrackingState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    // Data
    projects,
    entries,
    loading,
    error,

    // Tracking state
    trackingState,
    updateTrackingState,

    // Functions
    loadData,
    calculateElapsedTime,
    formatDuration,
    formatDurationWithSeconds,

    // Tracking controls
    startTracking,
    stopTracking,

    // Project management
    createProject,
    updateProject,
    deleteProject,

    // Entry management
    createManualEntry,
    updateEntry,
    deleteEntry,

    // Statistics
    calculateStats,
    getMonthlyChartData,
  };
}
