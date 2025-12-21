# Self and Group Modules - How It Works

## Overview

**Yes, this is exactly how it's set up!** Each context (Self and Group) has its own independent module configuration. They are completely separate.

---

## Two Separate Contexts

### 1. **Self View** (Personal)
- **Triggered when:** `currentGroup === null` or user selects "Self" from dropdown
- **Module Configuration:** Stored in `users.enabled_modules` (Supabase)
- **Who Controls:** The individual user
- **Where Configured:** Settings → Personal Settings → Enabled Modules

### 2. **Group View** (Family/Group)
- **Triggered when:** User selects a specific group from dropdown
- **Module Configuration:** Stored in `groups.enabled_modules` (Supabase)
- **Who Controls:** Group admins
- **Where Configured:** Settings → Group Settings → Enabled Modules

---

## Database Storage

### `users` Table
```sql
users.enabled_modules (JSONB)
```

**Example:**
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

**Stores:** Personal module preferences for each user

### `groups` Table
```sql
groups.enabled_modules (JSONB)
```

**Example:**
```json
{
  "checkins": true,
  "finance": true,
  "goals": false,
  "chat": true,
  "wishlist": true,
  "location": false,
  "calendar": true,
  "todos": true
}
```

**Stores:** Module configuration for each group (can be different per group)

---

## How Context Switching Works

### GroupContext Detection

```typescript
const { currentGroup, currentUser, isSelfView } = useGroup();
```

**Self View:**
- `currentGroup === null`
- `isSelfView === true`
- System checks: `currentUser.enabledModules`

**Group View:**
- `currentGroup !== null` (e.g., `currentGroup.id === "abc-123"`)
- `isSelfView === false`
- System checks: `currentGroup.enabledModules`

---

## Module Enablement Logic

### `isModuleEnabled()` Function

```typescript
isModuleEnabled(currentGroup, moduleId, currentUser)
```

**Flow:**

1. **If `currentGroup === null` (Self View):**
   ```typescript
   // Check user's personal module configuration
   return user.enabledModules[moduleId] ?? defaultEnabled
   ```

2. **If `currentGroup !== null` (Group View):**
   ```typescript
   // Check group's module configuration
   return group.enabledModules[moduleId] ?? defaultEnabled
   ```

**Key Point:** The same module can have different enabled/disabled states in Self vs Group!

---

## Real-World Example

### User: "John"
- **Personal Settings:**
  - Calendar: ✅ Enabled
  - Todos: ✅ Enabled
  - Finance: ❌ Disabled (doesn't want personal finance tracking)
  - Check-ins: ✅ Enabled

### Group: "Smith Family"
- **Group Settings:**
  - Calendar: ✅ Enabled
  - Todos: ✅ Enabled
  - Finance: ✅ Enabled (family wants to track expenses together)
  - Check-ins: ✅ Enabled

**Result:**
- When John views **Self**: Sees Calendar, Todos, Check-ins (Finance hidden)
- When John views **Smith Family**: Sees Calendar, Todos, Finance, Check-ins

**Same user, different modules visible based on context!**

---

## Settings Pages

### Personal Settings Tab
**Location:** `/dashboard/settings` → "Personal Settings" tab

**Shows:** All modules with toggles
**Saves to:** `users.enabled_modules` via `/api/users/me/modules`
**Who can change:** The logged-in user

### Group Settings Tab
**Location:** `/dashboard/settings` → "Group Settings" tab

**Shows:** All modules with toggles
**Saves to:** `groups.enabled_modules` via `/api/groups/[id]`
**Who can change:** Group admins only

---

## Navbar Behavior

The navbar automatically filters based on current context:

```typescript
// In Navbar component
const visibleItems = allItems.filter(item => {
  if (item.alwaysVisible) return true; // Dashboard, Settings
  
  // Check if module is enabled for CURRENT context
  return isModuleEnabled(currentGroup, item.moduleId, currentUser);
});
```

**Example:**
- Self View: Shows modules from `user.enabledModules`
- Group View: Shows modules from `currentGroup.enabledModules`

---

## API Endpoints

### User Modules
- **GET** `/api/users/me/modules` - Get current user's enabled modules
- **PATCH** `/api/users/me/modules` - Update current user's enabled modules

### Group Modules
- **GET** `/api/groups` - Returns groups with `enabledModules` field
- **PATCH** `/api/groups/[id]` - Update group including `enabledModules`

---

## Key Points

✅ **Independent Configuration:** Self and Group modules are completely separate  
✅ **Same User, Different Views:** User can have different modules enabled in Self vs each Group  
✅ **Per-Group Customization:** Each group can have different modules enabled  
✅ **User Control:** Users control their personal modules  
✅ **Admin Control:** Group admins control group modules  
✅ **Context-Aware:** System automatically checks the right configuration based on current view  

---

## Data Flow Diagram

```
User Action: Select "Self" or "Group"
    ↓
GroupContext updates: currentGroup (null or Group object)
    ↓
Component calls: isModuleEnabled(currentGroup, moduleId, currentUser)
    ↓
System checks:
  - If currentGroup === null → user.enabledModules[moduleId]
  - If currentGroup !== null → currentGroup.enabledModules[moduleId]
    ↓
Returns: true/false
    ↓
Navbar/UI shows/hides module accordingly
```

---

## Summary

**Yes, this is exactly how it's set up!**

- ✅ **Self** has its own module configuration (`users.enabled_modules`)
- ✅ **Each Group** has its own module configuration (`groups.enabled_modules`)
- ✅ They are **completely independent**
- ✅ Same module can be enabled in Self but disabled in a Group (or vice versa)
- ✅ System automatically uses the correct configuration based on current context

This gives maximum flexibility: users can customize their personal view, and each group can customize its group view independently!
