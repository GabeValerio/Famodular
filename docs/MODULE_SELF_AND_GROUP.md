# Module Configuration for Self and Group

## Overview

Both **Self** (personal/user) and **Group** contexts now support configurable modules. Users can enable/disable modules for their personal view, and group admins can configure modules for each group.

---

## How It Works

### Module Categories

Modules are categorized as either:
- **`group`**: Available only in group context (checkins, finance, goals, chat, wishlist, location)
- **`user`**: Available only in self/personal context (calendar, todos)

### Module Configuration

1. **Group Modules**: Stored in `groups.enabled_modules` (JSONB column)
2. **User Modules**: Stored in `users.enabled_modules` (JSONB column)

---

## Database Schema

### Groups Table
```sql
ALTER TABLE groups ADD COLUMN enabled_modules JSONB DEFAULT '{
  "checkins": false,
  "finance": false,
  "goals": false,
  "chat": true,
  "wishlist": false,
  "location": false,
  "calendar": true,
  "todos": false
}'::jsonb;
```

### Users Table
```sql
ALTER TABLE users ADD COLUMN enabled_modules JSONB DEFAULT '{
  "calendar": true,
  "todos": true
}'::jsonb;
```

See `docs/migrations/add_user_enabled_modules.sql` for the full migration.

---

## TypeScript Types

### UserModules
```typescript
export interface UserModules {
  calendar: boolean;
  todos: boolean;
}
```

### GroupModules
```typescript
export interface GroupModules {
  checkins: boolean;
  finance: boolean;
  goals: boolean;
  chat: boolean;
  wishlist: boolean;
  location: boolean;
  calendar: boolean;
  todos: boolean;
}
```

### User Interface
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  groups: GroupMember[];
  enabledModules?: UserModules; // NEW: Module configuration
}
```

---

## Module Registry Functions

### `isModuleEnabled(group, moduleId, user?)`

Checks if a module is enabled for the current context:

```typescript
// In group view
isModuleEnabled(currentGroup, 'checkins') // true/false based on group config

// In self view
isModuleEnabled(null, 'calendar', currentUser) // true/false based on user config
```

**Behavior:**
- **Group view**: Only group modules can be enabled. Checks `group.enabledModules`.
- **Self view**: Only user modules can be enabled. Checks `user.enabledModules`.
- Falls back to `defaultEnabled` if configuration is missing.

### `getEnabledModules(group, user?)`

Returns array of enabled module IDs for the current context.

---

## API Endpoints

### Get User Modules
```
GET /api/users/me/modules
```

Returns:
```json
{
  "enabledModules": {
    "calendar": true,
    "todos": true
  }
}
```

### Update User Modules
```
PATCH /api/users/me/modules
Content-Type: application/json

{
  "enabledModules": {
    "calendar": true,
    "todos": false
  }
}
```

---

## GroupContext Updates

The `GroupContext` now includes:

```typescript
interface GroupContextType {
  currentGroup: Group | null;
  groups: Group[];
  currentUser: User | null; // NEW: Current user with module config
  isSelfView: boolean;
  loading: boolean;
  setCurrentGroup: (group: Group | null) => void;
  setSelfView: () => void;
  refreshGroups: () => Promise<void>;
  refreshUser: () => Promise<void>; // NEW: Refresh user data
}
```

The context automatically fetches user module configuration when the session is available.

---

## Settings Page

### Personal Settings Tab

Users can configure their personal modules in **Settings > Personal Settings**:

- Shows only user modules (calendar, todos)
- Toggle switches to enable/disable
- "Save Module Settings" button to persist changes

### Group Settings Tab

Group admins can configure group modules in **Settings > Group Settings**:

- Shows all modules (group + user modules)
- Toggle switches to enable/disable
- Saved with group settings

---

## Usage Examples

### In a Component

```typescript
import { useGroup } from '@/lib/GroupContext';
import { isModuleEnabled } from '@/app/components/modules/registry';

export function MyComponent() {
  const { currentGroup, currentUser, isSelfView } = useGroup();
  
  // Check if calendar is enabled
  const calendarEnabled = isModuleEnabled(
    currentGroup, 
    'calendar', 
    currentUser
  );
  
  if (!calendarEnabled) {
    return <div>Calendar is disabled</div>;
  }
  
  return <CalendarComponent />;
}
```

### In a Hook

```typescript
import { useModuleAccess } from '@/app/components/modules/shared/hooks/useModuleAccess';

export function MyPage() {
  const { enabled, AccessDenied } = useModuleAccess('calendar');
  
  if (!enabled) {
    return <AccessDenied />;
  }
  
  return <CalendarPage />;
}
```

---

## Migration Steps

1. **Run the database migration:**
   ```sql
   -- See docs/migrations/add_user_enabled_modules.sql
   ```

2. **Update existing users:**
   ```sql
   UPDATE users 
   SET enabled_modules = '{"calendar": true, "todos": true}'::jsonb
   WHERE enabled_modules IS NULL;
   ```

3. **Restart the application** to load the new context behavior.

---

## Benefits

✅ **Consistent Architecture**: Both self and group have module configuration  
✅ **User Control**: Users can customize their personal modules  
✅ **Group Control**: Admins can customize group modules  
✅ **Type Safety**: Full TypeScript support  
✅ **Backward Compatible**: Defaults ensure existing functionality works  

---

## Summary

- **Self modules** are configured per user in `users.enabled_modules`
- **Group modules** are configured per group in `groups.enabled_modules`
- Both contexts use the same `isModuleEnabled()` function
- Settings page allows configuration for both contexts
- API endpoints support fetching and updating user modules

