'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { useTimeTracker } from '../hooks';
import { Clock, Play, Square, Calendar, Plus, Edit, Trash2, Timer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeTrackerProject, ManualEntryFormData, ProjectFormData } from '../types';

interface TimeTrackerProps {
  groupId?: string;
}

export function TimeTracker({ groupId }: TimeTrackerProps) {
  const {
    projects,
    entries,
    loading,
    error,
    trackingState,
    updateTrackingState,
    calculateElapsedTime,
    formatDuration,
    formatDurationWithSeconds,
    startTracking,
    stopTracking,
    createProject,
    updateProject,
    deleteProject,
    createManualEntry,
    updateEntry,
    deleteEntry,
    calculateStats,
    getMonthlyChartData,
  } = useTimeTracker({ groupId });

  // Dialog states
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [showManualEntryDialog, setShowManualEntryDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);

  // Form states
  const [manualEntryForm, setManualEntryForm] = useState<ManualEntryFormData>({
    startDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toTimeString().slice(0, 5),
  });
  const [projectForm, setProjectForm] = useState<ProjectFormData>({
    name: '',
    description: '',
    color: '#3b82f6',
  });

  const stats = calculateStats();
  const chartData = getMonthlyChartData();

  // Event handlers
  const handleStartTracking = async () => {
    await startTracking(trackingState.description, trackingState.selectedProjectId);
  };

  const handleStopTracking = async () => {
    await stopTracking();
    setShowStopDialog(false);
  };

  const handleManualAdd = () => {
    setManualEntryForm({
      startDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().slice(0, 5),
    });
    setShowManualEntryDialog(true);
  };

  const handleSaveManualEntry = async () => {
    try {
      const startDateTime = new Date(`${manualEntryForm.startDate}T${manualEntryForm.startTime}`);

      let endDateTime: Date | undefined;
      if (manualEntryForm.endTime && manualEntryForm.endDate) {
        endDateTime = new Date(`${manualEntryForm.endDate}T${manualEntryForm.endTime}`);
      }

      await createManualEntry({
        startTime: startDateTime,
        endTime: endDateTime,
        description: manualEntryForm.description,
        projectId: manualEntryForm.projectId,
      });

      setShowManualEntryDialog(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) return;

    try {
      await createProject({
        name: projectForm.name.trim(),
        description: projectForm.description?.trim(),
        color: projectForm.color,
      });

      setProjectForm({ name: '', description: '', color: '#3b82f6' });
      setShowProjectDialog(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleEditEntry = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    setManualEntryForm({
      projectId: entry.projectId,
      startDate: entry.startTime.toISOString().split('T')[0],
      startTime: entry.startTime.toTimeString().slice(0, 5),
      endDate: entry.endTime ? entry.endTime.toISOString().split('T')[0] : undefined,
      endTime: entry.endTime ? entry.endTime.toTimeString().slice(0, 5) : undefined,
      description: entry.description || '',
    });
    setEditingEntry(entryId);
    setShowManualEntryDialog(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry) return;

    try {
      const startDateTime = new Date(`${manualEntryForm.startDate}T${manualEntryForm.startTime}`);

      let endDateTime: Date | undefined;
      if (manualEntryForm.endTime && manualEntryForm.endDate) {
        endDateTime = new Date(`${manualEntryForm.endDate}T${manualEntryForm.endTime}`);
      }

      await updateEntry(editingEntry, {
        startTime: startDateTime,
        endTime: endDateTime,
        description: manualEntryForm.description,
        projectId: manualEntryForm.projectId,
      });

      setShowManualEntryDialog(false);
      setEditingEntry(null);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading time tracker...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Session Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Session
          </CardTitle>
          <CardDescription>
            Track time for {groupId ? 'your group' : 'your projects'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-mono font-bold">
                {trackingState.isTracking
                  ? formatDurationWithSeconds(calculateElapsedTime())
                  : '0:00:00'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {trackingState.isTracking ? 'Currently tracking time' : 'Not tracking'}
              </div>
            </div>
            <div className="flex gap-2">
              {!trackingState.isTracking ? (
                <Button onClick={handleStartTracking} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Start Time
                </Button>
              ) : (
                <Button
                  onClick={() => setShowStopDialog(true)}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop Time
                </Button>
              )}
            </div>
          </div>

          {!trackingState.isTracking && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-select">Project (optional)</Label>
                <Select
                  value={trackingState.selectedProjectId || 'none'}
                  onValueChange={(value) => updateTrackingState({
                    selectedProjectId: value === 'none' ? undefined : value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What are you working on?"
                  value={trackingState.description}
                  onChange={(e) => updateTrackingState({
                    description: e.target.value
                  })}
                  rows={2}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Today's Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalMinutesToday)}</div>
            <div className="text-sm text-muted-foreground">Hours worked today</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalMinutesThisWeek)}</div>
            <div className="text-sm text-muted-foreground">Hours worked this week</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Time Summary
          </CardTitle>
          <CardDescription>
            Total hours worked by month (last 12 months)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [`${value || 0} hours`, 'Total Time']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Recorded Time Entries
              </CardTitle>
              <CardDescription>
                Your recorded time entries {groupId ? 'for this group' : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowProjectDialog(true)} variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
              <Button onClick={handleManualAdd} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Manual Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {new Date(entry.startTime).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {entry.project ? (
                        <Badge variant="secondary" style={{ backgroundColor: entry.project.color + '20', color: entry.project.color }}>
                          {entry.project.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {new Date(entry.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="font-mono">
                      {entry.endTime
                        ? new Date(entry.endTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : <span className="text-orange-500 font-medium">In Progress</span>
                      }
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      {formatDuration(entry.durationMinutes || 0)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {entry.description ? (
                        <span className="text-sm">{entry.description}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">No notes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEntry(entry.id)}
                          className="h-8 w-8 p-0"
                          title="Edit entry"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {entry.endTime && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEntry(entry.id)}
                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stop Tracking Dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Time Tracking</DialogTitle>
            <DialogDescription>
              Do you want to stop tracking time? This will save the current session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStopTracking}>
              Stop Tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualEntryDialog} onOpenChange={(open) => {
        if (!open) {
          setShowManualEntryDialog(false);
          setEditingEntry(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Time Entry' : 'Add Manual Time Entry'}</DialogTitle>
            <DialogDescription>
              {editingEntry ? 'Update the time entry details.' : 'Manually add a time entry with specific start and end times.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={manualEntryForm.startDate}
                  onChange={(e) => setManualEntryForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={manualEntryForm.startTime}
                  onChange={(e) => setManualEntryForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="end-date">End Date (optional)</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={manualEntryForm.endDate || ''}
                  onChange={(e) => setManualEntryForm(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time (optional)</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={manualEntryForm.endTime || ''}
                  onChange={(e) => setManualEntryForm(prev => ({ ...prev, endTime: e.target.value || undefined }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="entry-project">Project (optional)</Label>
              <Select
                value={manualEntryForm.projectId || 'none'}
                onValueChange={(value) => setManualEntryForm(prev => ({
                  ...prev,
                  projectId: value === 'none' ? undefined : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entry-description">Description (optional)</Label>
              <Textarea
                id="entry-description"
                placeholder="What were you working on?"
                value={manualEntryForm.description || ''}
                onChange={(e) => setManualEntryForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowManualEntryDialog(false);
                setEditingEntry(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingEntry ? handleUpdateEntry : handleSaveManualEntry}>
              {editingEntry ? 'Update Entry' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your time tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={projectForm.name}
                onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                placeholder="Describe this project"
                value={projectForm.description || ''}
                onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="project-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="project-color"
                  type="color"
                  value={projectForm.color}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-8 p-1"
                />
                <span className="text-sm text-muted-foreground">Choose a color for this project</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!projectForm.name.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
