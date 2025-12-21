# Module Enablement Database Tables

## Overview

Module enablement is tracked in **two Supabase tables**, each with an `enabled_modules` JSONB column:

1. **`users` table** - Tracks personal/user modules (calendar, todos)
2. **`groups` table** - Tracks group modules (checkins, finance, goals, chat, wishlist, location)

---

## Table 1: `users` Table

### Column: `enabled_modules` (JSONB)

**Purpose:** Stores which personal/user modules are enabled for each user.

**Location:** `users.enabled_modules`

**Schema:**
```sql
ALTER TABLE users 
ADD COLUMN enabled_modules JSONB DEFAULT '{
  "calendar": true,
  "todos": true
}'::jsonb;
```

**Data Structure:**
```json
{
  "calendar": true,
  "todos": false
}
```

**API Endpoints:**
- **GET** `/api/users/me/modules` - Fetch current user's enabled modules
- **PATCH** `/api/users/me/modules` - Update current user's enabled modules

**Code References:**
- `app/api/users/me/modules/route.ts` - Handles GET and PATCH requests
- `lib/GroupContext.tsx` - Fetches user modules on mount
- `app/dashboard/settings/page.tsx` - UI for configuring user modules

**Example Query:**
```typescript
// Fetch user modules
const { data } = await supabase
  .from('users')
  .select('enabled_modules')
  .eq('id', userId)
  .single();

// Update user modules
await supabase
  .from('users')
  .update({ enabled_modules: { calendar: true, todos: false } })
  .eq('id', userId);
```

---

## Table 2: `groups` Table

### Column: `enabled_modules` (JSONB)

**Purpose:** Stores which group modules are enabled for each group.

**Location:** `groups.enabled_modules`

**Schema:**
```sql
ALTER TABLE groups
ADD COLUMN enabled_modules JSONB DEFAULT '{
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

**Data Structure:**
```json
{
  "checkins": true,
  "finance": false,
  "goals": true,
  "chat": true,
  "wishlist": false,
  "location": true,
  "calendar": true,
  "todos": true
}
```

**API Endpoints:**
- **GET** `/api/groups` - Returns groups with `enabledModules` field
- **PATCH** `/api/groups/[id]` - Updates group including `enabledModules`

**Code References:**
- `app/api/groups/route.ts` - Returns groups with enabled modules
- `app/api/groups/[id]/route.ts` - Updates group enabled modules
- `app/dashboard/settings/page.tsx` - UI for configuring group modules

**Example Query:**
```typescript
// Fetch group with modules
const { data } = await supabase
  .from('groups')
  .select('*')
  .eq('id', groupId)
  .single();

// Update group modules
await supabase
  .from('groups')
  .update({ 
    enabled_modules: { 
      checkins: true, 
      finance: false,
      goals: true 
    } 
  })
  .eq('id', groupId);
```

---

## Database Column Names

### Supabase (snake_case)
- `users.enabled_modules` 
- `groups.enabled_modules`

### TypeScript/JavaScript (camelCase)
- `user.enabledModules`
- `group.enabledModules`

**Note:** The API automatically converts between snake_case (database) and camelCase (TypeScript) when reading/writing.

---

## Migration Files

### Users Table Migration
**File:** `docs/migrations/add_user_enabled_modules.sql`

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS enabled_modules JSONB DEFAULT '{
  "calendar": true,
  "todos": true
}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_users_enabled_modules 
ON users USING GIN (enabled_modules);

UPDATE users 
SET enabled_modules = '{"calendar": true, "todos": true}'::jsonb
WHERE enabled_modules IS NULL;
```

### Groups Table Migration
**File:** (Referenced in `docs/MODULE_CONFIGURATION.md`)

```sql
ALTER TABLE groups 
ADD COLUMN enabled_modules JSONB DEFAULT '{
  "checkins": true,
  "finance": true,
  "goals": true,
  "chat": true,
  "wishlist": true,
  "location": true,
  "calendar": true,
  "todos": true
}'::jsonb;
```

---

## How It Works

### Reading Module Configuration

1. **User Modules (Self View):**
   ```typescript
   // From GroupContext
   const { currentUser } = useGroup();
   const calendarEnabled = currentUser?.enabledModules?.calendar;
   ```

2. **Group Modules (Group View):**
   ```typescript
   // From GroupContext
   const { currentGroup } = useGroup();
   const checkinsEnabled = currentGroup?.enabledModules?.checkins;
   ```

### Writing Module Configuration

1. **Update User Modules:**
   ```typescript
   // API call
   await fetch('/api/users/me/modules', {
     method: 'PATCH',
     body: JSON.stringify({ 
       enabledModules: { calendar: false, todos: true } 
     })
   });
   ```

2. **Update Group Modules:**
   ```typescript
   // API call
   await fetch(`/api/groups/${groupId}`, {
     method: 'PATCH',
     body: JSON.stringify({ 
       enabledModules: { checkins: true, finance: false } 
     })
   });
   ```

---

## Indexes

Both tables have GIN indexes on `enabled_modules` for efficient JSONB queries:

```sql
-- Users table
CREATE INDEX idx_users_enabled_modules 
ON users USING GIN (enabled_modules);

-- Groups table (recommended)
CREATE INDEX idx_groups_enabled_modules 
ON groups USING GIN (enabled_modules);
```

---

## Summary

| Table | Column | Purpose | Modules Tracked |
|-------|--------|---------|----------------|
| `users` | `enabled_modules` | Personal/user modules | `calendar`, `todos` |
| `groups` | `enabled_modules` | Group modules | `checkins`, `finance`, `goals`, `chat`, `wishlist`, `location`, `calendar`, `todos` |

**Key Points:**
- ✅ Both tables use JSONB for flexible module configuration
- ✅ Default values ensure modules are enabled by default
- ✅ Indexes improve query performance
- ✅ API endpoints handle conversion between snake_case and camelCase
- ✅ Each user can customize their personal modules
- ✅ Each group can customize its group modules
