# Module Tracking and Navigation

## Overview

The system tracks which modules are active/enabled based on the current context (Self or Group). The navbar dynamically shows only enabled modules for the active context.

---

## How Module Tracking Works

### Context Detection

The system uses `GroupContext` to determine the current context:

```typescript
const { currentGroup, currentUser, isSelfView } = useGroup();
```

- **Self View**: `currentGroup === null` and `isSelfView === true`
- **Group View**: `currentGroup !== null` and `isSelfView === false`

### Module Enablement Check

The `isModuleEnabled()` function checks if a module is enabled:

```typescript
isModuleEnabled(currentGroup, moduleId, currentUser)
```

**Behavior:**
- **Self View** (`currentGroup === null`):
  - Only `user` category modules can be enabled
  - Checks `currentUser.enabledModules[moduleId]`
  - Falls back to `defaultEnabled` if not configured
  
- **Group View** (`currentGroup !== null`):
  - Only `group` category modules can be enabled
  - Checks `currentGroup.enabledModules[moduleId]`
  - Falls back to `defaultEnabled` if not configured

---

## Navbar Filtering

### Location
`app/components/dashboard/Navbar.tsx`

### How It Works

1. **Define Navigation Items** with `moduleId`:
   ```typescript
   {
     title: "Calendar",
     href: "/dashboard/calendar",
     icon: MODULE_REGISTRY.calendar.icon,
     moduleId: "calendar" as ModuleId,
   }
   ```

2. **Filter Based on Context**:
   ```typescript
   const visibleItems = allItems.filter(item => {
     // Always show Dashboard and Settings
     if (item.alwaysVisible) return true;
     
     // Check if module is enabled for current context
     if (item.moduleId) {
       return isModuleEnabled(currentGroup, item.moduleId, currentUser);
     }
     
     return true;
   });
   ```

3. **Render Only Visible Items**:
   ```typescript
   {visibleItems.map((item) => (
     <Button asChild>
       <Link href={item.href}>
         <item.icon />
         <span>{item.title}</span>
       </Link>
     </Button>
   ))}
   ```

---

## Module Categories

### User Modules (Self View Only)
- `calendar` - Personal calendar
- `todos` - Personal tasks

### Group Modules (Group View Only)
- `checkins` - Family check-ins
- `finance` - Group finances
- `goals` - Family goals
- `chat` - Group chat
- `wishlist` - Group wishlist
- `location` - Location sharing

### Always Visible
- `dashboard` - Main dashboard (always visible)
- `settings` - Settings page (always visible)

---

## Example Scenarios

### Scenario 1: Self View with Calendar Disabled

**User Configuration:**
```json
{
  "enabledModules": {
    "calendar": false,
    "todos": true
  }
}
```

**Navbar Shows:**
- ✅ Dashboard
- ❌ Calendar (disabled)
- ✅ To Do (enabled)
- ✅ Settings

**Group modules are hidden** (not applicable in self view)

---

### Scenario 2: Group View with Some Modules Disabled

**Group Configuration:**
```json
{
  "enabledModules": {
    "checkins": true,
    "finance": false,
    "goals": true,
    "chat": true,
    "wishlist": false,
    "location": true
  }
}
```

**Navbar Shows:**
- ✅ Dashboard
- ✅ Check-ins
- ❌ Finance (disabled)
- ✅ Goals
- ✅ Chat
- ❌ Wishlist (disabled)
- ✅ Location
- ✅ Settings

**User modules are hidden** (not applicable in group view)

---

## Data Flow

```
User/Group Context
    ↓
GroupContext (currentGroup, currentUser, isSelfView)
    ↓
Navbar Component
    ↓
Filter: isModuleEnabled(currentGroup, moduleId, currentUser)
    ↓
Render Only Enabled Modules
```

---

## Key Functions

### `isModuleEnabled(group, moduleId, user?)`

Checks if a module is enabled for the current context.

**Parameters:**
- `group: Group | null` - Current group (null for self view)
- `moduleId: ModuleId` - Module to check
- `user?: User | null` - Current user (optional, used in self view)

**Returns:** `boolean`

### `getEnabledModules(group, user?)`

Returns array of enabled module IDs for the current context.

**Parameters:**
- `group: Group | null` - Current group (null for self view)
- `user?: User | null` - Current user (optional, used in self view)

**Returns:** `ModuleId[]`

---

## Testing Module Visibility

### In Self View
1. Go to Settings > Personal Settings
2. Disable a user module (e.g., Calendar)
3. Navigate to dashboard
4. Check navbar - Calendar should be hidden

### In Group View
1. Select a group
2. Go to Settings > Group Settings
3. Disable a group module (e.g., Finance)
4. Navigate to dashboard
5. Check navbar - Finance should be hidden

---

## Summary

✅ **Navbar automatically filters** based on current context  
✅ **Self view** shows only enabled user modules  
✅ **Group view** shows only enabled group modules  
✅ **Dashboard and Settings** are always visible  
✅ **Module enablement** is checked in real-time via `isModuleEnabled()`  

The system ensures users only see modules that are:
1. Applicable to the current context (user vs group)
2. Enabled in the configuration (user.enabledModules or group.enabledModules)



