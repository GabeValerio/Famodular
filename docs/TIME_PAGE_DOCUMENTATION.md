# Time Tracking Page Implementation Guide

This document explains how to implement a comprehensive time tracking page similar to the `/time` page in this project. The implementation includes real-time tracking, data persistence, statistics, and a clean UI.

## Overview

The `/time` page is a full-featured time tracking application that allows users to:
- Track time in real-time with start/stop functionality
- Manually add/edit time entries
- View time statistics and charts
- Persist data using localStorage

## Architecture

### File Structure
```
app/time/
├── layout.tsx          # Layout with sidebar navigation
├── page.tsx           # Main page component
└── components/
    └── TimeTracker.tsx # Core time tracking logic
```

### Key Dependencies
- **UI Components**: shadcn/ui (Button, Card, Dialog, Table, etc.)
- **Charts**: Recharts (BarChart, ResponsiveContainer)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS
- **State Management**: React hooks

## Implementation Details

### 1. Layout Structure (`layout.tsx`)

The layout provides a consistent sidebar navigation with hover-to-expand functionality:

```tsx
'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/dreamyhaus/Sidebar';
import { DreamyhausProvider } from '@/lib/DreamyhausContext';

export default function TimeLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <DreamyhausProvider>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Sidebar
          isExpanded={isSidebarExpanded}
          onHover={setIsSidebarExpanded}
        />
        <main
          className={`p-4 min-h-screen transition-all duration-300 ease-in-out ml-0 ${
            isSidebarExpanded ? 'md:ml-64' : 'md:ml-24'
          }`}
        >
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </DreamyhausProvider>
  );
}
```

**Key Features:**
- Responsive sidebar that collapses to 24px width on smaller screens
- Smooth transitions for sidebar expansion/collapse
- Uses context provider for global state management

### 2. Main Page Component (`page.tsx`)

Simple wrapper that renders the TimeTracker component:

```tsx
'use client';

import { TimeTracker } from '@/time/components/TimeTracker';

export default function TimePage() {
  return (
    <div className="w-full py-4">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track your time spent on DreamyProp Project (3007)
          </p>
        </div>

        <TimeTracker />
      </div>
    </div>
  );
}
```

### 3. Core Time Tracker Component (`TimeTracker.tsx`)

#### State Management
```tsx
interface TimeEntry {
  id: string;
  project_number: number;
  project_name: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Component state
const [isTracking, setIsTracking] = useState(false);
const [startTime, setStartTime] = useState<Date | null>(null);
const [currentTime, setCurrentTime] = useState(new Date());
const [description, setDescription] = useState('');
const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
const intervalRef = useRef<NodeJS.Timeout | null>(null);
```

#### Real-Time Timer Logic
```tsx
// Update current time every second when tracking
useEffect(() => {
  if (isTracking) {
    intervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
  } else {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [isTracking]);

const calculateElapsedTime = () => {
  if (!startTime) return 0;
  return Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
};
```

#### Data Persistence
```tsx
const loadTimeEntries = () => {
  try {
    const savedEntries = localStorage.getItem('timeEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      setTimeEntries(entries);
    }
  } catch (error) {
    setTimeEntries([]);
  }
};

const saveTimeEntries = (entries: TimeEntry[]) => {
  try {
    localStorage.setItem('timeEntries', JSON.stringify(entries));
  } catch (error) {
    // Handle storage errors
  }
};
```

## UI Components and Features

### 1. Current Session Timer
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Clock className="h-5 w-5" />
      Current Session
    </CardTitle>
    <CardDescription>
      Track time for DreamyProp Project (3007)
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-3xl font-mono font-bold">
          {isTracking ? formatDurationWithSeconds(calculateElapsedTime()) : '0:00:00'}
        </div>
        <div className="text-sm text-muted-foreground">
          {isTracking ? 'Currently tracking time' : 'Not tracking'}
        </div>
      </div>
      <div className="flex gap-2">
        {!isTracking ? (
          <Button onClick={handleStartTracking} className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Start Time
          </Button>
        ) : (
          <Button onClick={handleStopTracking} variant="destructive" className="flex items-center gap-2">
            <Square className="h-4 w-4" />
            Stop Time
          </Button>
        )}
      </div>
    </div>

    {!isTracking && (
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description (optional)
        </label>
        <Textarea
          id="description"
          placeholder="What are you working on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
    )}
  </CardContent>
</Card>
```

### 2. Statistics Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">Today's Total</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{formatDuration(totalMinutesToday)}</div>
      <div className="text-sm text-muted-foreground">Hours worked today</div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">This Week</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{formatDuration(totalMinutesThisWeek)}</div>
      <div className="text-sm text-muted-foreground">Hours worked this week</div>
    </CardContent>
  </Card>
</div>
```

### 3. Monthly Time Chart
```tsx
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
          <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}h`}
          />
          <Tooltip
            formatter={(value: number) => [`${value} hours`, 'Total Time']}
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
```

### 4. Time Entries Table
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recorded Time Entries
        </CardTitle>
        <CardDescription>
          Your recorded time entries for DreamyProp Project
        </CardDescription>
      </div>
      <Button onClick={handleManualAdd} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Manual Add
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {timeEntries
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
          .map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">
                {new Date(entry.start_time).toLocaleDateString()}
              </TableCell>
              <TableCell className="font-mono">
                {new Date(entry.start_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </TableCell>
              <TableCell className="font-mono">
                {entry.end_time
                  ? new Date(entry.end_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : <span className="text-orange-500 font-medium">In Progress</span>
                }
              </TableCell>
              <TableCell className="font-mono font-bold">
                {formatDuration(entry.duration_minutes)}
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
                    onClick={() => handleEditEntry(entry)}
                    className="h-8 w-8 p-0"
                    title="Edit entry"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {entry.end_time && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry.id)}
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
```

## Key Functionality

### 1. Start/Stop Tracking
- `handleStartTracking()`: Creates a new time entry and starts the timer
- `handleStopTracking()`: Opens a confirmation dialog to add description
- `handleConfirmStop()`: Saves the time entry with end time and description

### 2. Manual Entry Management
- `handleManualAdd()`: Opens dialog to manually add time entries
- `handleEditEntry()`: Opens dialog to edit existing entries
- `handleSaveEntry()`: Validates and saves entry data

### 3. Data Calculations
- **Duration Formatting**: Converts minutes to HH:MM format
- **Statistics**: Calculates daily and weekly totals
- **Monthly Data**: Aggregates data for chart visualization

### 4. Validation
```tsx
const handleSaveEntry = () => {
  if (!formData.startDate || !formData.startTime) {
    alert('Start Date and Start Time are required');
    return;
  }

  const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);

  let endDateTime: Date | null = null;
  if (formData.endTime) {
    const endDate = formData.endDate || formData.startDate;
    endDateTime = new Date(`${endDate}T${formData.endTime}`);
  }

  if (endDateTime && endDateTime <= startDateTime) {
    alert('End time must be after start time');
    return;
  }
  // ... save logic
};
```

## Styling and UI Considerations

### Design System
- Uses CSS custom properties for theming (hsl(var(--background)), hsl(var(--foreground)))
- Consistent spacing and typography
- Responsive design with mobile-first approach
- Dark/light mode support through CSS variables

### Key UI Patterns
- Card-based layout for different sections
- Consistent button styling and icon usage
- Dialog modals for forms and confirmations
- Table layout for data display
- Chart visualization for statistics

### Accessibility
- Proper labels and ARIA attributes
- Keyboard navigation support
- Screen reader friendly descriptions
- Focus management in dialogs

## Installation Requirements

### Dependencies to Add
```json
{
  "dependencies": {
    "recharts": "^2.x.x",
    "lucide-react": "^0.x.x"
  }
}
```

### Required UI Components (shadcn/ui)
- Button, Card, Dialog, Input, Label, Table, Textarea, Badge

## Customization Options

### 1. Project Configuration
- Change project number and name in the component
- Customize localStorage key for data persistence

### 2. UI Theming
- Modify CSS custom properties for different color schemes
- Adjust component spacing and sizing

### 3. Feature Extensions
- Add project selection dropdown
- Implement data export functionality
- Add time tracking categories/tags
- Integrate with external time tracking APIs

### 4. Data Storage
- Replace localStorage with database persistence
- Add user authentication and multi-user support
- Implement data synchronization across devices

## Performance Considerations

### Optimization Tips
- Debounce localStorage writes to reduce I/O operations
- Memoize expensive calculations (statistics, chart data)
- Use React.memo for components that don't need frequent re-renders
- Implement pagination for large entry lists

### Memory Management
- Clean up intervals on component unmount
- Limit stored entries to prevent localStorage bloat
- Compress data before storing in localStorage

This implementation provides a solid foundation for a time tracking application that can be easily customized and extended for various use cases.
