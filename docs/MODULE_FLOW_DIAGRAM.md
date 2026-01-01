# Module Architecture Flow Diagram

## Visual Representation of How Modules Work

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                             │
│                    /dashboard/checkins                           │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTE PAGE (Next.js)                          │
│              app/dashboard/checkins/page.tsx                      │
│                                                                   │
│  import { CheckInsPage } from '@/modules/group/checkins'         │
│  return <CheckInsPage groupId={currentGroup.id} />               │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MODULE PAGE                                   │
│    modules/group/checkins/pages/CheckInsPage.tsx                 │
│                                                                   │
│  const { checkIns, loading, addCheckIn } = useCheckIns(groupId)  │
│  return <CheckInsComponent {...props} />                         │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOM HOOK                                   │
│        modules/group/checkins/hooks/useCheckIns.ts              │
│                                                                   │
│  - Manages state (checkIns, loading, error)                      │
│  - Calls service methods                                         │
│  - Handles side effects                                          │
│  - Returns data and functions                                    │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                 │
│      modules/group/checkins/services/checkInsService.ts         │
│                                                                   │
│  - Makes fetch() calls to API routes                             │
│  - Handles request/response transformation                       │
│  - Error handling                                                │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ROUTE (Next.js)                           │
│        app/api/modules/group/checkins/route.ts                  │
│                                                                   │
│  - Authentication/Authorization                                  │
│  - Database queries (Supabase)                                  │
│  - Business logic validation                                    │
│  - Returns JSON response                                         │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase)                            │
│                    check_ins table                               │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
CheckInsPage (Module Page)
  └── useCheckIns Hook
      ├── checkInsService.getCheckIns()
      ├── checkInsService.getMembers()
      └── checkInsService.getQuestions()
  └── CheckInsComponent (UI)
      ├── CheckInCard (sub-component)
      ├── ShareFeelingForm (sub-component)
      └── QuestionCard (sub-component)
```

## File Organization

```
app/
├── dashboard/
│   └── checkins/
│       └── page.tsx                    # Route handler (thin wrapper)
│
├── components/
│   └── modules/
│       └── group/
│           └── checkins/
│               ├── index.ts            # Public exports
│               ├── pages/
│               │   └── CheckInsPage.tsx # Main page component
│               ├── components/
│               │   ├── CheckInsComponent.tsx
│               │   └── ShareFeelingForm.tsx
│               ├── hooks/
│               │   └── useCheckIns.ts  # Data fetching logic
│               ├── services/
│               │   └── checkInsService.ts # API calls
│               ├── types.ts            # Module types
│               └── utils.ts            # Helper functions
│
└── api/
    └── modules/
        └── group/
            └── checkins/
                └── route.ts            # API endpoint
```

## Data Flow Example: Adding a Check-In

```
1. User clicks "Share Feeling" button
   ↓
2. CheckInsComponent calls onAddCheckIn(checkIn)
   ↓
3. CheckInsPage receives callback, calls addCheckIn from hook
   ↓
4. useCheckIns hook calls checkInsService.createCheckIn(checkIn)
   ↓
5. Service makes POST to /api/modules/group/checkins
   ↓
6. API route validates, inserts into database
   ↓
7. API returns new check-in object
   ↓
8. Service returns data to hook
   ↓
9. Hook updates state: setCheckIns([newCheckIn, ...checkIns])
   ↓
10. Component re-renders with new check-in
```

## Module Dependencies

```
┌─────────────────┐
│  CheckIns Module│
└────────┬────────┘
         │
         ├──► Shared UI Components (Button, Card, etc.)
         ├──► GroupContext (current group)
         ├──► Types from @/types/family
         └──► API Routes (/api/modules/group/checkins)
```

## Benefits Visualization

### Before (Current Structure)
```
app/
├── dashboard/
│   └── checkins/
│       └── page.tsx          # Has all logic, data fetching, UI
├── components/
│   └── dashboard/
│       └── components/
│           └── CheckIns.tsx  # Mixed with other features
└── types/
    └── family.ts              # All types in one file
```

**Problems:**
- ❌ Logic scattered across files
- ❌ Hard to find related code
- ❌ Difficult to test
- ❌ Tight coupling

### After (Modular Structure)
```
modules/group/checkins/
├── components/     # All UI in one place
├── hooks/          # All state logic in one place
├── services/       # All API calls in one place
├── types.ts        # Module-specific types
└── index.ts        # Clear public API
```

**Benefits:**
- ✅ Everything related is together
- ✅ Easy to find code
- ✅ Easy to test
- ✅ Loose coupling
- ✅ Reusable hooks and services






