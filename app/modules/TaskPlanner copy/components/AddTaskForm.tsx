'use client';

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { TASK_TYPES } from './TaskTypeIcon';
import { Goal, NewTaskForm } from '../types';
import Image from 'next/image';

// Define interface for the timezones
interface Timezone {
  value: string;
  label: string;
}

// Props for the TaskForm component
interface AddTaskFormProps {
  newTask: NewTaskForm;
  setNewTask: (task: NewTaskForm) => void;
  handleAddTask: (e: React.FormEvent) => Promise<void>;
  setIsAddingTask: (isAdding: boolean) => void;
  goals: Goal[];
  tasks: { id: string; text?: string; title?: string }[];
  timezones: Timezone[];
  selectedTimezone: string;
}

// Define interfaces for memoized components
interface MemoizedInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  required?: boolean;
  rows?: number;
}

interface MemoizedSelectProps {
  label: string;
  value: string | null;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: React.ReactNode;
}

// Memoized input components
const MemoizedInput = memo(({ label, value, onChange, type = 'text', required = false, rows = 1 }: MemoizedInputProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {rows > 1 ? (
      <textarea
        value={value}
        onChange={onChange}
        className="w-full p-2 border rounded"
        rows={rows}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full p-2 border rounded"
        required={required}
      />
    )}
  </div>
));

MemoizedInput.displayName = 'MemoizedInput';

const MemoizedSelect = memo(({ label, value, onChange, options }: MemoizedSelectProps) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <select
      className="w-full p-2 border rounded"
      value={value || ''}
      onChange={onChange}
    >
      {options}
    </select>
  </div>
));

MemoizedSelect.displayName = 'MemoizedSelect';

export default function AddTaskForm({
  newTask,
  setNewTask,
  handleAddTask,
  setIsAddingTask,
  goals,
  tasks,
  timezones,
  selectedTimezone
}: AddTaskFormProps) {
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localTitle, setLocalTitle] = useState(newTask.title);
  const [localDescription, setLocalDescription] = useState(newTask.description);

  // Update local state when newTask changes
  useEffect(() => {
    setLocalTitle(newTask.title);
    setLocalDescription(newTask.description);
  }, [newTask.title, newTask.description]);

  // Memoize the goals and tasks options
  const goalOptions = useMemo(() => (
    <>
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
    </>
  ), [goals]);

  const taskOptions = useMemo(() => (
    <>
      <option value="">No Parent Task</option>
      {tasks.slice()
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
    </>
  ), [tasks]);

  // Debounced update functions
  const debouncedSetTitle = useCallback((value: string) => {
    setNewTask({ ...newTask, title: value });
  }, [setNewTask, newTask]);

  const debouncedSetDescription = useCallback((value: string) => {
    setNewTask({ ...newTask, description: value });
  }, [setNewTask, newTask]);

  // Optimized handlers
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalTitle(value);
    debouncedSetTitle(value);
  }, [debouncedSetTitle]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalDescription(value);
    debouncedSetDescription(value);
  }, [debouncedSetDescription]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
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
      setNewTask({ ...newTask, image_url: data.secure_url });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  }, [setNewTask, newTask]);

  return (
    <form onSubmit={handleAddTask} className="space-y-4">
      <MemoizedInput
        label="Title"
        value={localTitle}
        onChange={handleTitleChange}
        required
      />

      <MemoizedInput
        label="Description"
        value={localDescription}
        onChange={handleDescriptionChange}
        rows={3}
      />

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload"
            className={`px-4 py-2 border rounded cursor-pointer ${
              isUploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </label>
          {newTask.image_url && (
            <div className="relative w-20 h-20">
              <Image
                src={newTask.image_url}
                alt="Task"
                className="object-cover rounded"
                fill
                sizes="80px"
              />
              <button
                type="button"
                onClick={() => setNewTask({ ...newTask, image_url: null })}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={newTask.date}
            onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            type="time"
            value={newTask.time}
            onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={newTask.end_date}
            onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="time"
            value={newTask.end_time}
            onChange={(e) => setNewTask({ ...newTask, end_time: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Goal</label>
          <select
            className="w-full p-2 border rounded"
            value={newTask.goal_id || ''}
            onChange={(e) => setNewTask({
              ...newTask,
              goal_id: e.target.value === '' ? null : e.target.value
            })}
          >
            {goalOptions}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Parent Task</label>
          <select
            className="w-full p-2 border rounded"
            value={newTask.parent_id || ''}
            onChange={(e) => setNewTask({
              ...newTask,
              parent_id: e.target.value === '' ? null : e.target.value
            })}
          >
            {taskOptions}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <div className="relative">
          <button
            type="button"
            className={`flex items-center gap-2 w-full p-2 rounded-lg border ${showTypeDropdown ? 'ring-2 ring-offset-1 ring-blue-500' : 'hover:bg-gray-50'}`}
            style={{ backgroundColor: TASK_TYPES[newTask.type.toUpperCase()]?.bgColor || 'white' }}
            onClick={() => setShowTypeDropdown((prev: boolean) => !prev)}
          >
            {(() => {
              const Icon = TASK_TYPES[newTask.type.toUpperCase()]?.icon;
              return Icon ? <Icon className={`w-5 h-5 ${TASK_TYPES[newTask.type.toUpperCase()]?.className}`} /> : null;
            })()}
            <span className="text-sm">{TASK_TYPES[newTask.type.toUpperCase()]?.label || newTask.type}</span>
            <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showTypeDropdown && (
            <div
              className="absolute left-0 top-full mt-2 w-full rounded-lg shadow-lg border z-50"
              style={{ backgroundColor: TASK_TYPES[newTask.type.toUpperCase()]?.bgColor || '#FFFFFF' }}
            >
              <div className="grid grid-cols-3 sm:grid-cols-8 gap-1">
                {Object.entries(TASK_TYPES).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    className="flex flex-col items-center gap-1 w-full px-2 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    style={{ backgroundColor: value.bgColor }}
                    onClick={() => {
                      setNewTask({ ...newTask, type: key.toLowerCase() });
                      setShowTypeDropdown(false);
                    }}
                  >
                    <value.icon className={`w-6 h-6 ${value.className}`} />
                    <span className="text-xs text-center whitespace-nowrap">{value.label || key}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 -mt-1">
        Using timezone: {timezones.find(tz => tz.value === selectedTimezone)?.label || selectedTimezone}
      </div>

      {/* Recurring task section */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id="isRecurring"
            checked={newTask.is_recurring}
            onChange={(e) => setNewTask({ ...newTask, is_recurring: e.target.checked })}
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <label htmlFor="isRecurring" className="text-sm font-medium">
            Recurring task
          </label>
        </div>

        {newTask.is_recurring && (
          <div className="pl-6 space-y-4 border-l-2 border-blue-100">
            <div>
              <label className="block text-sm font-medium mb-1">Repeat</label>
              <div className="flex gap-2">
                <select
                  value={newTask.recurrence_interval}
                  onChange={(e) => setNewTask({ ...newTask, recurrence_interval: parseInt(e.target.value) })}
                  className="p-2 border rounded w-24"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>Every {num}</option>
                  ))}
                </select>

                <select
                  value={newTask.recurrence_pattern}
                  onChange={(e) => setNewTask({ ...newTask, recurrence_pattern: e.target.value })}
                  className="p-2 border rounded flex-grow"
                >
                  <option value="daily">Day(s)</option>
                  <option value="weekly">Week(s)</option>
                  <option value="monthly">Month(s)</option>
                  <option value="yearly">Year(s)</option>
                </select>
              </div>
            </div>

            {newTask.recurrence_pattern === 'weekly' && (
              <div>
                <label className="block text-sm font-medium mb-1">On these days</label>
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`
                        p-2 rounded-full w-8 h-8 flex items-center justify-center text-sm
                        ${newTask.recurrence_day_of_week.includes(index)
                          ? ''
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      `}
                      style={{
                        backgroundColor: newTask.recurrence_day_of_week.includes(index) ? '#2563eb' : undefined,
                        color: newTask.recurrence_day_of_week.includes(index) ? '#fff' : undefined,
                        border: newTask.recurrence_day_of_week.includes(index) ? '2px solid #2563eb' : '1px solid #e5e7eb'
                      }}
                      onClick={() => {
                        const newDays = newTask.recurrence_day_of_week.includes(index)
                          ? newTask.recurrence_day_of_week.filter(d => d !== index)
                          : [...newTask.recurrence_day_of_week, index];
                        setNewTask({ ...newTask, recurrence_day_of_week: newDays });
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {newTask.recurrence_pattern === 'monthly' && (
              <div>
                <label className="block text-sm font-medium mb-1">On day of month</label>
                <div className="flex flex-wrap gap-1">
                  <select
                    value={newTask.recurrence_day_of_month[0] || 1}
                    onChange={(e) => {
                      const day = parseInt(e.target.value);
                      setNewTask({ ...newTask, recurrence_day_of_month: [day] });
                    }}
                    className="p-2 border rounded"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {newTask.recurrence_pattern === 'yearly' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Month</label>
                  <select
                    value={newTask.recurrence_month[0] || 0}
                    onChange={(e) => {
                      const month = parseInt(e.target.value);
                      setNewTask({ ...newTask, recurrence_month: [month] });
                    }}
                    className="p-2 border rounded w-full"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July',
                      'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                      <option key={idx} value={idx}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Day</label>
                  <select
                    value={newTask.recurrence_day_of_month[0] || 1}
                    onChange={(e) => {
                      const day = parseInt(e.target.value);
                      setNewTask({ ...newTask, recurrence_day_of_month: [day] });
                    }}
                    className="p-2 border rounded w-full"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Ends</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="endNever"
                    checked={newTask.recurrence_end_type === 'never'}
                    onChange={() => setNewTask({ ...newTask, recurrence_end_type: 'never' })}
                    className="mr-2"
                  />
                  <label htmlFor="endNever" className="text-sm">Never</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="endOnDate"
                    checked={newTask.recurrence_end_type === 'on_date'}
                    onChange={() => setNewTask({ ...newTask, recurrence_end_type: 'on_date' })}
                    className="mr-2"
                  />
                  <label htmlFor="endOnDate" className="text-sm">On date</label>
                  {newTask.recurrence_end_type === 'on_date' && (
                    <input
                      type="date"
                      value={newTask.recurrence_end_date}
                      onChange={(e) => setNewTask({ ...newTask, recurrence_end_date: e.target.value })}
                      className="ml-2 p-1 border rounded text-sm"
                    />
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="endAfter"
                    checked={newTask.recurrence_end_type === 'after_occurrences'}
                    onChange={() => setNewTask({ ...newTask, recurrence_end_type: 'after_occurrences' })}
                    className="mr-2"
                  />
                  <label htmlFor="endAfter" className="text-sm">After</label>
                  {newTask.recurrence_end_type === 'after_occurrences' && (
                    <input
                      type="number"
                      value={newTask.recurrence_count}
                      onChange={(e) => setNewTask({ ...newTask, recurrence_count: parseInt(e.target.value) })}
                      min="1"
                      className="ml-2 p-1 border rounded w-16 text-sm"
                    />
                  )}
                  {newTask.recurrence_end_type === 'after_occurrences' && (
                    <span className="ml-2 text-sm">occurrences</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 font-medium border border-blue-600 shadow-sm transition-all duration-200 flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </button>
        <button
          type="button"
          onClick={() => setIsAddingTask(false)}
          className="flex-1 bg-white py-3 px-4 rounded-md hover:bg-gray-100 text-gray-700 font-medium border border-gray-300 shadow-sm transition-all duration-200 flex items-center justify-center"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
      </div>
    </form>
  );
}
