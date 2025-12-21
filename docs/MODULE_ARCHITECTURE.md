# Module Architecture Guide

## How Modules Work

This document explains how the modular architecture functions in practice.

---

## 1. Module Structure

Each module is self-contained with its own:
- **Components**: UI components
- **Hooks**: Data fetching and state management
- **Services**: API calls and business logic
- **Types**: TypeScript definitions
- **Utils**: Helper functions

---

## 2. Data Flow Example: CheckIns Module

### Step 1: Page Imports from Module

**File: `app/dashboard/checkins/page.tsx`**
```typescript
"use client";

import { CheckInsPage } from '@/app/components/modules/group/checkins';
import { useGroup } from '@/lib/GroupContext';

export default function CheckInsRoute() {
  const { currentGroup } = useGroup();
  
  // The module handles all its own data fetching
  return <CheckInsPage groupId={currentGroup?.id} />;
}
```

### Step 2: Module Page Uses Custom Hook

**File: `app/components/modules/group/checkins/pages/CheckInsPage.tsx`**
```typescript
"use client";

import { useCheckIns } from '../hooks/useCheckIns';
import { CheckInsComponent } from '../components/CheckInsComponent';

export function CheckInsPage({ groupId }: { groupId: string }) {
  // Custom hook handles all data fetching and state
  const {
    checkIns,
    members,
    questions,
    loading,
    error,
    addCheckIn,
    addQuestion,
    refreshCheckIns
  } = useCheckIns(groupId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <CheckInsComponent
      checkIns={checkIns}
      members={members}
      questions={questions}
      onAddCheckIn={addCheckIn}
      onAddQuestion={addQuestion}
    />
  );
}
```

### Step 3: Custom Hook Uses Service

**File: `app/components/modules/group/checkins/hooks/useCheckIns.ts`**
```typescript
import { useState, useEffect } from 'react';
import { checkInsService } from '../services/checkInsService';
import { CheckIn, Question, FamilyMember } from '../types';

export function useCheckIns(groupId: string) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [checkInsData, membersData, questionsData] = await Promise.all([
        checkInsService.getCheckIns(groupId),
        checkInsService.getMembers(groupId),
        checkInsService.getQuestions(groupId),
      ]);
      setCheckIns(checkInsData);
      setMembers(membersData);
      setQuestions(questionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  };

  const addCheckIn = async (checkIn: Omit<CheckIn, 'id' | 'timestamp'>) => {
    try {
      const newCheckIn = await checkInsService.createCheckIn(checkIn);
      setCheckIns(prev => [newCheckIn, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add check-in');
      throw err;
    }
  };

  const addQuestion = async (question: Omit<Question, 'id' | 'timestamp'>) => {
    try {
      const newQuestion = await checkInsService.createQuestion(question);
      setQuestions(prev => [newQuestion, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
      throw err;
    }
  };

  return {
    checkIns,
    members,
    questions,
    loading,
    error,
    addCheckIn,
    addQuestion,
    refreshCheckIns: loadData,
  };
}
```

### Step 4: Service Calls API Routes

**File: `app/components/modules/group/checkins/services/checkInsService.ts`**
```typescript
import { CheckIn, Question, FamilyMember } from '../types';

const API_BASE = '/api/modules/group/checkins';

export const checkInsService = {
  async getCheckIns(groupId: string): Promise<CheckIn[]> {
    const response = await fetch(`${API_BASE}?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch check-ins');
    return response.json();
  },

  async createCheckIn(checkIn: Omit<CheckIn, 'id' | 'timestamp'>): Promise<CheckIn> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkIn),
    });
    if (!response.ok) throw new Error('Failed to create check-in');
    return response.json();
  },

  async getMembers(groupId: string): Promise<FamilyMember[]> {
    const response = await fetch(`${API_BASE}/members?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  },

  async getQuestions(groupId: string): Promise<Question[]> {
    const response = await fetch(`${API_BASE}/questions?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    return response.json();
  },

  async createQuestion(question: Omit<Question, 'id' | 'timestamp'>): Promise<Question> {
    const response = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!response.ok) throw new Error('Failed to create question');
    return response.json();
  },
};
```

### Step 5: API Route Handles Database

**File: `app/api/modules/group/checkins/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId required' }, { status: 400 });
    }

    // Verify user has access to this group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('groupId', groupId)
      .eq('userId', session.user.id)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch check-ins
    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('groupId', groupId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return NextResponse.json(checkIns);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, memberId, mood, note, location, questionId } = body;

    // Verify user has access
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('groupId', groupId)
      .eq('userId', session.user.id)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create check-in
    const { data: checkIn, error } = await supabase
      .from('check_ins')
      .insert({
        groupId,
        memberId: memberId || session.user.id,
        mood,
        note,
        location,
        questionId,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 6: Module Exports Public API

**File: `app/components/modules/group/checkins/index.ts`**
```typescript
// Public API - only export what other modules/pages should use
export { CheckInsPage } from './pages/CheckInsPage';
export { CheckInsComponent } from './components/CheckInsComponent';
export { useCheckIns } from './hooks/useCheckIns';
export type { CheckIn, Question } from './types';
```

---

## 3. Module Types

**File: `app/components/modules/group/checkins/types.ts`**
```typescript
// Module-specific types (can extend shared types)
import { CheckIn as BaseCheckIn, Question as BaseQuestion } from '@/types/family';

export interface CheckIn extends BaseCheckIn {
  // Add module-specific fields if needed
  reactions?: CheckInReaction[];
}

export interface Question extends BaseQuestion {
  // Add module-specific fields if needed
}

export interface CheckInReaction {
  id: string;
  checkInId: string;
  memberId: string;
  emoji: string;
  timestamp: Date;
}
```

---

## 4. Using Shared Code

**File: `app/components/modules/group/checkins/components/CheckInsComponent.tsx`**
```typescript
import { Button } from '@/app/components/ui/button'; // Shared UI component
import { useGroup } from '@/lib/GroupContext'; // Shared context
import { formatDate } from '@/app/components/modules/shared/utils/dateUtils'; // Shared utility
import { CheckIn, FamilyMember } from '../types';

export function CheckInsComponent({ checkIns, members }: Props) {
  const { currentGroup } = useGroup();
  
  return (
    <div>
      {checkIns.map(checkIn => (
        <div key={checkIn.id}>
          <p>{formatDate(checkIn.timestamp)}</p>
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Cross-Module Communication

If the Goals module needs to show check-in progress:

**File: `app/components/modules/group/goals/components/GoalCard.tsx`**
```typescript
import { useCheckIns } from '@/app/components/modules/group/checkins';

export function GoalCard({ goal }: { goal: Goal }) {
  // Import hook from another module
  const { checkIns } = useCheckIns(goal.groupId);
  
  // Use check-ins data to show mood trends
  const moodTrend = analyzeMoodTrend(checkIns);
  
  return (
    <div>
      <h3>{goal.title}</h3>
      <p>Team Mood: {moodTrend}</p>
    </div>
  );
}
```

---

## 6. Benefits in Practice

### ✅ **Clear Separation of Concerns**
- Each module owns its data, UI, and logic
- Easy to find where code lives
- Changes are localized

### ✅ **Reusability**
- Hooks can be used across pages
- Components can be composed
- Services can be shared

### ✅ **Testability**
- Test hooks in isolation
- Mock services easily
- Test components independently

### ✅ **Scalability**
- Add new modules without touching existing code
- Teams can work on different modules
- Easy to lazy-load modules

### ✅ **Type Safety**
- Each module exports its types
- TypeScript catches errors at compile time
- Clear contracts between modules

---

## 7. Module Template

When creating a new module:

```
modules/group/new-feature/
├── components/
│   ├── FeatureComponent.tsx
│   └── index.ts
├── hooks/
│   ├── useFeature.ts
│   └── index.ts
├── services/
│   ├── featureService.ts
│   └── index.ts
├── pages/
│   ├── FeaturePage.tsx
│   └── index.ts
├── types.ts
├── utils.ts
└── index.ts          # Public API
```

---

## 8. Migration Path

1. **Start with one module** (e.g., checkins)
2. **Move components** to module structure
3. **Create hooks** for data fetching
4. **Create services** for API calls
5. **Create API routes** under `/api/modules/`
6. **Update imports** in pages
7. **Repeat** for other modules

---

## Summary

**Data Flow:**
```
Page → Module Page → Custom Hook → Service → API Route → Database
```

**Key Principles:**
- Modules are self-contained
- Hooks handle state and data fetching
- Services handle API communication
- Types ensure type safety
- Shared code lives in `shared/` or root `lib/`

This architecture makes the codebase maintainable, scalable, and easy to understand.


