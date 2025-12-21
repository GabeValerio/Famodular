# Module Structure Implementation

## ✅ Completed

The complete modular folder structure has been implemented for all modules.

## Folder Structure Created

```
app/components/modules/
├── registry.ts                    # Module registry with definitions
├── group/
│   ├── checkins/
│   │   ├── components/           # ✅ (existing - needs update)
│   │   ├── pages/
│   │   │   └── CheckInsPage.tsx  # ✅ Updated to use hook
│   │   ├── hooks/
│   │   │   └── useCheckIns.ts    # ✅ Created
│   │   ├── services/
│   │   │   └── checkInsService.ts # ✅ Created
│   │   ├── types.ts              # ✅ Created
│   │   ├── utils.ts              # ✅ Created
│   │   └── index.ts              # ✅ Created
│   ├── finance/
│   │   ├── components/           # ✅ (existing - needs update)
│   │   ├── pages/
│   │   │   └── FinancePage.tsx   # ✅ Created
│   │   ├── hooks/
│   │   │   └── useFinance.ts     # ✅ Created
│   │   ├── services/
│   │   │   └── financeService.ts # ✅ Created
│   │   ├── types.ts              # ✅ Created
│   │   ├── utils.ts              # ✅ Created
│   │   └── index.ts              # ✅ Created
│   ├── goals/
│   │   ├── components/           # ✅ (existing - needs update)
│   │   ├── pages/
│   │   │   └── GoalsPage.tsx    # ✅ Created
│   │   ├── hooks/
│   │   │   └── useGoals.ts       # ✅ Created
│   │   ├── services/
│   │   │   └── goalsService.ts   # ✅ Created
│   │   ├── types.ts              # ✅ Created
│   │   └── index.ts              # ✅ Created
│   ├── chat/
│   │   ├── components/           # ⚠️ Needs to be created
│   │   ├── pages/
│   │   │   └── ChatPage.tsx      # ✅ Created
│   │   ├── hooks/
│   │   │   └── useChat.ts        # ✅ Created
│   │   ├── services/
│   │   │   └── chatService.ts    # ✅ Created
│   │   ├── types.ts              # ✅ Created
│   │   └── index.ts              # ✅ Created
│   ├── wishlist/
│   │   ├── components/           # ⚠️ Needs to be created
│   │   ├── pages/
│   │   │   └── WishlistPage.tsx  # ✅ Created
│   │   ├── hooks/
│   │   │   └── useWishlist.ts    # ✅ Created
│   │   ├── services/
│   │   │   └── wishlistService.ts # ✅ Created
│   │   ├── types.ts              # ✅ Created
│   │   └── index.ts              # ✅ Created
│   └── location/
│       ├── components/           # ⚠️ Needs to be created
│       ├── pages/
│       │   └── LocationPage.tsx  # ✅ Created
│       ├── hooks/
│       │   └── useLocation.ts    # ✅ Created
│       ├── services/
│       │   └── locationService.ts # ✅ Created
│       ├── types.ts              # ✅ Created
│       └── index.ts              # ✅ Created
├── user/
│   └── calendar/
│       ├── components/           # ✅ (existing - needs update)
│       ├── pages/
│       │   └── CalendarPage.tsx  # ✅ Created
│       ├── hooks/
│       │   └── useCalendar.ts    # ✅ Created
│       ├── services/
│       │   └── calendarService.ts # ✅ Created
│       ├── types.ts              # ✅ Created
│       └── index.ts              # ✅ Created
└── shared/
    ├── hooks/
    │   └── useModuleAccess.ts    # ✅ Created
    └── utils/
        └── index.ts              # ✅ Created
```

## Files Created

### Core Infrastructure
- ✅ `types/family.ts` - Updated with `GroupModules` interface and `enabledModules` field
- ✅ `app/components/modules/registry.ts` - Module registry system

### Module Files Created (per module)
Each module now has:
- ✅ `types.ts` - Module-specific types
- ✅ `services/[module]Service.ts` - API service layer
- ✅ `hooks/use[Module].ts` - Custom React hook
- ✅ `pages/[Module]Page.tsx` - Page component using hook
- ✅ `utils.ts` - Module utilities (where applicable)
- ✅ `index.ts` - Public API exports

### Shared Files
- ✅ `shared/hooks/useModuleAccess.ts` - Hook to check module access
- ✅ `shared/utils/index.ts` - Shared utility functions

## Next Steps

### 1. Update Component Files
The existing component files in `app/components/dashboard/components/` need to be:
- Moved to their respective module `components/` folders
- Updated to use the new module structure
- Renamed to match module naming (e.g., `CheckIns.tsx` → `CheckInsComponent.tsx`)

**Components to move/update:**
- `CheckIns.tsx` → `modules/group/checkins/components/CheckInsComponent.tsx`
- `Finance.tsx` → `modules/group/finance/components/FinanceComponent.tsx`
- `Goals.tsx` → `modules/group/goals/components/GoalsComponent.tsx`
- `Chat.tsx` → `modules/group/chat/components/ChatComponent.tsx`
- `Wishlist.tsx` → `modules/group/wishlist/components/WishlistComponent.tsx`
- `FamilyMap.tsx` → `modules/group/location/components/LocationComponent.tsx`
- `Calendar.tsx` → `modules/user/calendar/components/CalendarComponent.tsx`

### 2. Update Route Pages
Update the route pages in `app/dashboard/[module]/page.tsx` to:
- Import from module index
- Use the module page component
- Pass `groupId` from context

Example:
```typescript
// app/dashboard/checkins/page.tsx
import { CheckInsPage } from '@/app/components/modules/group/checkins';
import { useGroup } from '@/lib/GroupContext';

export default function CheckInsRoute() {
  const { currentGroup } = useGroup();
  return <CheckInsPage groupId={currentGroup.id} />;
}
```

### 3. Create API Routes
Create API routes under `app/api/modules/`:
- `app/api/modules/group/checkins/route.ts`
- `app/api/modules/group/finance/route.ts`
- `app/api/modules/group/goals/route.ts`
- `app/api/modules/group/chat/route.ts`
- `app/api/modules/group/wishlist/route.ts`
- `app/api/modules/group/location/route.ts`
- `app/api/modules/user/calendar/route.ts`

### 4. Update Navigation
Update `app/components/dashboard/Navbar.tsx` to:
- Use module registry
- Filter navigation based on enabled modules
- Use `isModuleEnabled()` helper

### 5. Add Module Settings UI
Add module configuration UI to settings page for admins to enable/disable modules.

## Module Usage Examples

### Using a Module Hook
```typescript
import { useCheckIns } from '@/app/components/modules/group/checkins';

function MyComponent() {
  const { checkIns, loading, addCheckIn } = useCheckIns(groupId);
  // ...
}
```

### Using a Module Page
```typescript
import { CheckInsPage } from '@/app/components/modules/group/checkins';

<CheckInsPage groupId={currentGroup.id} />
```

### Checking Module Access
```typescript
import { useModuleAccess } from '@/app/components/modules/shared/hooks/useModuleAccess';

function MyComponent() {
  const { enabled, AccessDenied } = useModuleAccess('checkins');
  if (!enabled) return <AccessDenied />;
  // ...
}
```

## Benefits Achieved

✅ **Modular Architecture** - Each feature is self-contained
✅ **Reusable Hooks** - Data fetching logic is reusable
✅ **Type Safety** - Module-specific types
✅ **Clear Structure** - Easy to find and maintain code
✅ **Scalable** - Easy to add new modules
✅ **Testable** - Modules can be tested in isolation

## Status

- ✅ Folder structure: **Complete**
- ✅ Types & Registry: **Complete**
- ✅ Hooks & Services: **Complete**
- ⚠️ Component migration: **Pending**
- ⚠️ Route updates: **Pending**
- ⚠️ API routes: **Pending**
- ⚠️ Navigation updates: **Pending**

The foundation is complete! Next step is to migrate the existing components and update the routes.
