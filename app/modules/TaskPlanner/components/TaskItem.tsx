'use client'
import React from 'react'
import { Task, Goal } from '../types'
import { useState, useRef} from 'react'
import { ChevronDown, X, Plus, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { TASK_TYPES } from './TaskTypeIcon'
import Image from 'next/image'

export interface TaskItemProps {
  task: Task;
  tasks: Task[];
  goals?: Goal[];
  level?: number;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onAddNested?: (taskId: string) => void;
  onAddSubtask?: (taskId: string) => void; // Alias for onAddNested for TaskCard compatibility
  onMoveUp?: (taskId: string) => void;
  onMoveDown?: (taskId: string) => void;
  isPriorityEditMode?: boolean;
  handlePriorityUpdate?: (taskId: string, newPriority: number) => Promise<void>;
  handleUpdateTask?: (taskId: string, newText: string, newType: string, newDueDate?: Date | null, newGoalId?: string, newImageUrl?: string | null) => Promise<void>;
  onTaskEdit?: (task: Task) => void; // For TaskCard compatibility - opens edit mode
  isExpanded?: boolean;
  onToggleExpand?: (taskId: string) => void;
  hasChildren?: boolean;
  handleUpdateException?: (taskId: string, isException: boolean) => Promise<void>;
  onAddTemplatedTasks?: (parentId: string, templates: { text: string; type: string }[]) => void;
  handleConvertNestedTypes?: (parentId: string, newType: string) => Promise<void>;
  handleUpdateTime?: (taskId: string, estimatedTime?: number | null, completedTime?: number | null) => Promise<void>;
  isSelected?: boolean;
  onSelect?: () => void;
  onToggle?: (task: Task) => void;
  onTaskToggle?: (task: Task) => void; // Alias for onToggle for TaskCard compatibility
  onTaskDelete?: (taskId: string) => void; // Alias for onDelete for TaskCard compatibility
  onDragStart?: (task: Task) => void;
  taskCompletions?: { task_id: string; completed: boolean }[];
  selectedTimezone: string;
  // TaskCard compatibility props
  compact?: boolean; // Compact mode with purple background
  showGoalLabel?: boolean; // Show goal name at bottom right
}

const TaskTypeIcon = ({ type }: { type: string | undefined }) => {
  const taskType = TASK_TYPES[(type || 'personal').toUpperCase()] || TASK_TYPES.PERSONAL;
  return <taskType.icon className={`w-5 h-5 ${taskType.className}`} />;
};

const formatDateForDisplay = (dateStr: string | null, timezone: string): string => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: timezone
    });
  } catch (e) {
    return '';
  }
};

const formatDateForInput = (date: Date | string | null): string => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

export default function TaskItem({
  task,
  tasks,
  goals = [],
  level = 0,
  isPriorityEditMode = false,
  handlePriorityUpdate,
  handleUpdateTask,
  onTaskEdit,
  isExpanded,
  onToggleExpand,
  hasChildren,
  handleUpdateTime,
  isSelected = false,
  onSelect,
  onDragStart,
  onToggleComplete,
  onAddNested,
  onAddSubtask,
  onTaskToggle,
  onTaskDelete,
  taskCompletions = [],
  selectedTimezone,
  compact = false,
  showGoalLabel = false,
}: TaskItemProps) {
  // Use aliases for TaskCard compatibility
  const handleToggle = (taskIdOrTask: string | Task) => {
    if (onTaskToggle) {
      const taskObj = typeof taskIdOrTask === 'string' ? task : taskIdOrTask;
      onTaskToggle(taskObj);
    } else if (onToggleComplete) {
      const taskId = typeof taskIdOrTask === 'string' ? taskIdOrTask : taskIdOrTask.id;
      onToggleComplete(taskId);
    }
  };
  
  const handleDelete = (taskId: string) => {
    if (onTaskDelete) {
      onTaskDelete(taskId);
    }
  };
  
  const handleAddSubtask = (taskId: string) => {
    if (onAddSubtask) {
      onAddSubtask(taskId);
    } else if (onAddNested) {
      onAddNested(taskId);
    }
  };
  
  // Get goal name for label
  const getGoalName = (goalId: string | undefined): string => {
    if (!goalId) return '';
    const goal = goals.find(g => g.id === goalId);
    return goal?.goal || goal?.text || '';
  };
  
  const goalId = task.goalId || task.goal_id;
  const goalName = showGoalLabel ? getGoalName(goalId) : '';
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [priorityInput, setPriorityInput] = useState(() => task.priority?.toString() || '0');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingType, setEditingType] = useState<string>('');
  const [editingDueDate, setEditingDueDate] = useState<Date | null>(() => {
    const dueDate = task.dueDate || task.due_date;
    return dueDate ? new Date(dueDate as string) : null;
  });
  const [editingGoalId, setEditingGoalId] = useState<string>(() => {
    return task.goalId || task.goal_id || '';
  });
  const [editingEstimatedTime, setEditingEstimatedTime] = useState<number | null>(() => {
    return task.estimatedTime || task.estimated_time || null;
  });
  const [editingCompletedTime, setEditingCompletedTime] = useState<number | null>(() => {
    return task.completedTime || task.completed_time || null;
  });

  const taskElementRef = useRef<HTMLDivElement>(null);

  const taskType = task.type?.toUpperCase() || 'PERSONAL';

  // For daily tasks, check completion in taskCompletions
  const isCompleted = task.type === 'daily'
    ? taskCompletions.find(c => c.task_id === task.id)?.completed || false
    : task.completed;

  // Background color - use purple for compact mode, otherwise use task type color
  const backgroundColor = compact
    ? (isCompleted ? '#F9FAFB' : '#F3E8FF') // purple-50 for compact mode
    : (isCompleted ? '#F9FAFB' : TASK_TYPES[taskType]?.bgColor || '#FFFFFF');

  const handleTaskUpdate = async (taskId: string, newText: string, newType: string, newDueDate?: Date | null, newGoalId?: string, newImageUrl?: string | null) => {
    try {
      const formattedDate = newDueDate
        ? new Date(newDueDate.toISOString().split('T')[0] + 'T12:00:00Z')
        : null;

      if (handleUpdateTask) {
        await handleUpdateTask(
          taskId,
          newText,
          newType,
          formattedDate,
          newGoalId,
          newImageUrl
        );
      }

      const estimatedTime = editingEstimatedTime === null ? null : Math.max(0, parseInt(String(editingEstimatedTime), 10));
      const completedTime = editingCompletedTime === null ? null : Math.max(0, parseInt(String(editingCompletedTime), 10));

      if (handleUpdateTime) {
        await handleUpdateTime(taskId, estimatedTime, completedTime);
      }

      setEditingTaskId(null);
      setEditingText('');
      setEditingType('');
      setEditingDueDate(null);
      setEditingGoalId('');
      setEditingEstimatedTime(null);
      setEditingCompletedTime(null);
    } catch (error) {
    }
  };

  const renderPriorityEdit = () => {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={priorityInput}
          onChange={(e) => setPriorityInput(e.target.value)}
          onBlur={async () => {
            const newPriority = parseInt(priorityInput);
            if (!isNaN(newPriority) && handlePriorityUpdate) {
              await handlePriorityUpdate(task.id, newPriority);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          className="w-20"
        />
      </div>
    );
  };

  const renderTimeInputs = () => (
    <div className="flex gap-3">
      <div className="flex-1">
        <Input
          type="number"
          placeholder="Est. minutes"
          value={editingEstimatedTime === null ? '' : editingEstimatedTime}
          onChange={(e) => {
            const value = e.target.value;
            setEditingEstimatedTime(value === '' ? null : parseInt(value, 10));
          }}
          className="w-full"
          min="0"
        />
      </div>
      <div className="flex-1">
        <Input
          type="number"
          placeholder="Actual minutes"
          value={editingCompletedTime === null ? '' : editingCompletedTime}
          onChange={(e) => {
            const value = e.target.value;
            setEditingCompletedTime(value === '' ? null : parseInt(value, 10));
          }}
          className="w-full"
          min="0"
        />
      </div>
    </div>
  );

  // Format date as MM/DD for compact mode
  const formatDate = (dateStr: string | Date | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  // Handle onTaskEdit - trigger edit mode
  const handleEditClick = () => {
    if (onTaskEdit) {
      onTaskEdit(task);
    } else if (handleUpdateTask) {
      // Trigger inline edit mode
      setEditingTaskId(task.id);
      setEditingText(task.text || task.title || '');
      setEditingType(task.type || 'personal');
      const dueDate = task.dueDate || task.due_date;
      setEditingDueDate(dueDate ? new Date(dueDate as string) : null);
      setEditingGoalId(task.goalId || task.goal_id || '');
      setEditingEstimatedTime(task.estimatedTime || task.estimated_time || null);
      setEditingCompletedTime(task.completedTime || task.completed_time || null);
    }
  };

  return (
    <div
      className={`
        relative
        ${level > 0 ? 'ml-2' : ''}
        ${task.parent_id ? 'pl-2' : ''}
        ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
        ${compact ? '' : (isSelected ? '' : 'bg-white hover:bg-gray-50')}
      `}
      onClick={onSelect}
      draggable={!compact && true}
      onDragStart={!compact ? (e) => {
        e.stopPropagation();
        const taskData = {
          taskId: task.id,
          text: task.text || '',
          type: task.type || 'personal',
          estimated_time: task.estimated_time
        };
        e.dataTransfer.setData('application/json', JSON.stringify(taskData));
        if (onDragStart) {
          onDragStart(task);
        }
      } : undefined}
      onDoubleClick={!compact ? (e) => {
        e.stopPropagation();
        handleToggle(task);
      } : undefined}
    >
      <div
        ref={taskElementRef}
        className={`
          group relative
          flex items-${compact ? 'start' : 'center'} gap-${compact ? '3' : '2'} 
          ${compact ? 'p-3' : 'p-4'} 
          ${compact ? 'rounded-lg border' : 'border rounded-xl shadow-sm'}
          ${compact ? '' : 'hover:shadow-md'} 
          transition-all duration-200
          ${level > 0 ? '' : ''}
          ${!isPriorityEditMode ? 'cursor-default' : ''}
          ${compact && isCompleted ? 'opacity-75' : ''}
        `}
        style={{
          marginLeft: compact ? '0' : `${level * 0.75}rem`,
          backgroundColor: compact ? backgroundColor : undefined,
          borderColor: compact ? (isCompleted ? undefined : 'rgb(243 232 255)') : undefined, // purple-100 for compact
          minHeight: editingTaskId === task.id ? '8rem' : 'auto'
        }}
      >
        {isPriorityEditMode ? (
          // Simplified view for priority edit mode
          <>
            {renderPriorityEdit()}
            <span className="flex-1">{task.text}</span>
          </>
        ) : (
          <>
            {editingTaskId === task.id ? (
              <form
                className="flex-1 flex flex-col gap-3 w-full"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleTaskUpdate(
                    task.id,
                    editingText,
                    editingType,
                    editingDueDate,
                    editingGoalId,
                    null
                  );
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Type, Goal, and Date Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Type and Date Container for mobile */}
                  <div className="flex gap-3 justify-between sm:justify-start sm:w-auto">
                    {/* Type Selector */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTypeMenuOpen(!typeMenuOpen)}
                        className="flex items-center gap-2"
                      >
                        {(() => {
                          const Icon = TASK_TYPES[editingType.toUpperCase()]?.icon;
                          return Icon ? <Icon className={`w-4 h-4 ${TASK_TYPES[editingType.toUpperCase()]?.className}`} /> : null;
                        })()}
                        <span>{TASK_TYPES[editingType.toUpperCase()]?.label || editingType}</span>
                      </Button>

                      {typeMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                          {Object.entries(TASK_TYPES).map(([key, value]) => (
                            <button
                              key={key}
                              type="button"
                              className="flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                              style={{ backgroundColor: value.bgColor }}
                              onClick={() => {
                                setEditingType(key.toLowerCase());
                                setTypeMenuOpen(false);
                              }}
                            >
                              <value.icon className={`w-5 h-5 ${value.className}`} />
                              {value.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Image Upload */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          try {
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
                            await handleTaskUpdate(task.id, editingText, editingType, editingDueDate, editingGoalId, data.secure_url);
                          } catch (error) {
                          }
                        }}
                        className="hidden"
                        id={`image-upload-${task.id}`}
                      />
                      <label
                        htmlFor={`image-upload-${task.id}`}
                        className="px-4 py-2 border rounded cursor-pointer hover:bg-gray-50"
                      >
                        {(task.imageUrl || task.image_url) ? 'Change Image' : 'Add Image'}
                      </label>
                      {(task.imageUrl || task.image_url) && (
                        <div className="absolute right-0 top-full mt-2 w-32 h-32">
                          <Image
                            src={(task.imageUrl || task.image_url) as string}
                            alt="Task"
                            className="object-cover rounded"
                            width={128}
                            height={128}
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await handleTaskUpdate(task.id, editingText, editingType, editingDueDate, editingGoalId, null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Goal Selector */}
                  <select
                    value={editingGoalId}
                    onChange={(e) => setEditingGoalId(e.target.value)}
                    className="w-full sm:flex-1 rounded-md border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="">No Goal</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.goal || goal.text}
                      </option>
                    ))}
                  </select>

                  {/* Date Input - desktop only */}
                  <div className="hidden sm:block">
                    <Input
                      type="date"
                      value={formatDateForInput(editingDueDate)}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          const date = new Date(value + 'T12:00:00Z');
                          setEditingDueDate(date);
                        } else {
                          setEditingDueDate(null);
                        }
                      }}
                      className="w-40"
                    />
                  </div>
                </div>

                {/* Time Inputs Row */}
                {renderTimeInputs()}

                {/* Text Input and Buttons Row */}
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingTaskId(null);
                      setEditingText('');
                      setEditingType('');
                      setEditingDueDate(null);
                      setEditingGoalId('');
                      setEditingEstimatedTime(null);
                      setEditingCompletedTime(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                {/* Task Icon - Left side, aligned top in compact mode */}
                <div className={`flex-shrink-0 ${compact ? 'mt-0.5' : 'flex flex-col items-center gap-1'}`}>
                  <TaskTypeIcon type={task.type} />
                  {(task.dueDate || task.due_date) && (
                    <span className={`${compact ? 'text-xs text-gray-500 mt-1' : 'text-[10px] text-gray-500'}`}>
                      {compact 
                        ? formatDate(task.dueDate || task.due_date)
                        : formatDateForDisplay((task.dueDate || task.due_date) as string, task.timezone || selectedTimezone)
                      }
                    </span>
                  )}
                </div>

                {/* Task Content - Takes remaining space */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {hasChildren && !compact && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand?.(task.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200
                            ${isExpanded ? 'transform rotate-180' : ''}`}
                        />
                      </button>
                    )}

                    <div className="flex items-center gap-2 flex-1">
                      {(task.imageUrl || task.image_url) && !compact && (
                        <div className="w-8 h-8 flex-shrink-0">
                          <Image
                            src={(task.imageUrl || task.image_url) as string}
                            alt="Task"
                            className="object-cover rounded"
                            width={32}
                            height={32}
                          />
                        </div>
                      )}
                      <span className={`
                        ${isCompleted ? 'line-through text-gray-500' : compact ? 'text-gray-900 font-medium' : ''}
                        break-words
                        ${compact ? '' : 'max-w-[calc(100%-2rem)] overflow-hidden text-ellipsis'}
                        ${level > 0 && !compact ? 'sm:line-clamp-2' : compact ? '' : 'sm:line-clamp-1'}
                      `}>
                        {task.text || task.title}
                      </span>
                    </div>
                  </div>

                  {/* Date - Below title in compact mode, left-aligned */}
                  {compact && (task.dueDate || task.due_date) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(task.dueDate || task.due_date)}
                    </div>
                  )}

                  {/* Goal Label - Bottom right in compact mode */}
                  {compact && goalName && (
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {goalName}
                    </div>
                  )}

                  {/* Parent Task Badge - moved under task text (non-compact) */}
                  {!compact && (task.parentId || task.parent_id) && tasks && (
                    <span className="text-[10px] text-gray-500">
                      {(() => {
                        const parentId = task.parentId || task.parent_id;
                        const parentTask = tasks.find(t => t.id === parentId);
                        return parentTask ? (parentTask.text || parentTask.title) : 'unknown task';
                      })()}
                    </span>
                  )}

                  {/* Add time display if times are set (non-compact) */}
                  {!compact && ((task.estimatedTime || task.estimated_time) || (task.completedTime || task.completed_time)) && (
                    <div className="text-xs text-gray-500 flex gap-2">
                      {(task.estimatedTime || task.estimated_time) && (
                        <span>Est: {task.estimatedTime || task.estimated_time}m</span>
                      )}
                      {(task.completedTime || task.completed_time) && (
                        <span>Actual: {task.completedTime || task.completed_time}m</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: 4 Action Buttons - Always visible, horizontally aligned */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Button 1: Plus (+) - Add subtask */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-gray-100 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSubtask(task.id);
                    }}
                    title="Add subtask"
                    type="button"
                  >
                    <Plus className="w-4 h-4 text-gray-700" />
                  </Button>

                  {/* Button 2: Pencil (✏️) - Edit task */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-gray-100 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick();
                    }}
                    title="Edit task"
                    type="button"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </Button>

                  {/* Button 3: Trash (🗑️) - Delete task - Red on hover */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(task.id);
                    }}
                    title="Delete task"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {/* Button 4: Circle/Check (○/✓) - Toggle completion */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-gray-100 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(task);
                    }}
                    title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    type="button"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
