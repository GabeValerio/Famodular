# Famodular Module Architecture

## Overview

Famodular uses a dynamic, database-driven module system that allows features to be toggled on or off independently for both **Personal (Self)** and **Group** contexts. This flexibility ensures that users and families only see the features they actually use.

## Core Concepts

### 1. Module Definition
Modules are defined in the `modules` table in the database and the `ModuleConfig` type in the codebase.

**Key properties:**
- `id`: Unique identifier (e.g., `'notepad'`, `'calendar'`).
- `category`: Informational tag (`'user'` or `'group'`). **Note:** This does not restrict usage; any module can be enabled in any context.
- `default_enabled`: Whether the module is enabled by default for new users/groups.

### 2. Contexts
The application runs in one of two contexts:
- **Self View (`group === null`)**: Personal space.
- **Group View (`group !== null`)**: Shared family/group space.

### 3. Enabling & Disabling Logic

Module visibility is determined by the `isModuleEnabled` function in `useModules.ts`.

**Logic Flow:**

1. **Check Context:** Determine if we are in Self or Group view.
2. **Check Configuration:**
   - **Self View:** Look at `user.enabled_modules` JSONB column.
   - **Group View:** Look at `group.enabled_modules` JSONB column.
3. **Strict Checking vs. Default:**
   - **If Configuration Exists:** We perform a **strict check**. The module is enabled ONLY if the key exists AND is explicitly `true`. If the key is missing (e.g., an old group that hasn't configured a new module), it returns `false` (disabled).
   - **If Configuration is Missing:** (e.g., a brand new user/group with no config yet), we fallback to `module.default_enabled`.

**Code Example (`useModules.ts`):**
```typescript
if (group.enabledModules) {
  // Config exists -> Strict Check
  // Missing key = undefined = false
  return group.enabledModules[moduleId] === true;
}
// No config -> Fallback to default
return module.defaultEnabled;
```

This ensures that adding a new module (like "Notepad") doesn't automatically clutter existing groups unless they explicitly opt-in, while allowing new groups to start with a sensible default set.

## Database Schema

### `modules` Table
Registry of all available modules.
```sql
id TEXT PRIMARY KEY, -- 'notepad'
name TEXT,           -- 'Notepad'
default_enabled BOOLEAN, -- true/false
category TEXT        -- 'user'/'group'
```

### `users` and `groups` Tables
Both tables store configuration in a JSONB column: `enabled_modules`.

**Example JSON:**
```json
{
  "calendar": true,
  "todos": true,
  "notepad": false,  // Explicitly disabled
  "plants": true
}
```

## Adding a New Module

1. **Database:** Insert a row into the `modules` table.
2. **Types:** Add the module key to `ModuleConfig` interface in `types/family.ts`.
3. **Frontend:** Create the module folder structure (`app/modules/new-module/...`).
4. **Access Control:** Wrap the module page with `useModuleAccess` to enforce permissions.

## Access Control Implementation

To protect a page from being accessed when disabled (e.g., via direct URL navigation), use the `useModuleAccess` hook:

```typescript
// app/modules/notepad/pages/NotepadPage.tsx
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';

export function NotepadPage() {
  const { enabled, AccessDenied } = useModuleAccess('notepad');

  if (!enabled && AccessDenied) {
    return <AccessDenied />;
  }

  return <NotepadComponent />;
}
```

## UI Components

- **Navbar:** Automatically filters navigation items based on `isModuleEnabled`.
- **Settings:** Provides toggles for users (Personal Settings) and admins (Group Settings) to modify the `enabled_modules` JSON.
- **Module Disabled Screen:** Standardized component shown when a user tries to access a disabled module.






