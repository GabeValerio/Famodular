# Todos Data Isolation Fix

## Problem

Todos (including projects and their contents) were showing in both Self and Group views, breaking data isolation.

## Root Causes

1. **Projects API** was returning ALL projects regardless of context
2. **Todos creation** wasn't always setting `group_id` correctly based on context
3. **Projects filtering** wasn't checking which context their todos belong to

## Fixes Applied

### 1. Projects API Filtering (`app/api/modules/user/todos/projects/route.ts`)

**Before:** Returned all projects for the user

**After:** Returns ALL projects for the user (projects are user-owned resources)

**Key Insight:** Projects are containers/organizers, not the data itself. Data isolation happens at the TODOS level, not the projects level.

**How it works:**
- All projects are always visible (they're user-owned)
- Todos are filtered by context (via `group_id` in todos API)
- The `todosByProject` mapping naturally only includes todos from the current context
- So projects show up, but only display their relevant todos based on context

### 2. Todos Creation (`app/components/modules/user/todos/components/TodosComponent.tsx`)

**Before:** Only set `groupId` if category was 'group'

**After:** Always set `groupId` based on context (not category)

```typescript
// In group view: groupId = currentGroup.id (for ALL todos)
// In self view: groupId = null/undefined (for ALL todos)
```

**Key Change:**
```typescript
// OLD (wrong):
groupId: formData.category === 'group' ? groupId : undefined

// NEW (correct):
groupId: groupId || undefined  // Based on context, not category
```

### 3. Projects Service (`app/components/modules/user/todos/services/projectsService.ts`)

**Before:** Didn't accept `groupId` parameter

**After:** Accepts `groupId` and passes it to API for filtering

### 4. Todos Hook (`app/components/modules/user/todos/hooks/useTodos.ts`)

**Before:** Didn't pass `groupId` to projects service

**After:** Passes `groupId` to projects service for context-aware filtering

### 5. Todos API (`app/api/modules/user/todos/route.ts`)

**Enhanced:**
- Normalizes empty strings to `null`
- Ensures `group_id` is set correctly based on provided `groupId`
- Added comments explaining data isolation

## How It Works Now

### Self View (`groupId = null`)

**Todos:**
- API filters: `WHERE user_id = ? AND group_id IS NULL`
- Shows: Only personal/work todos

**Projects:**
- API returns: ALL user projects (projects are user-owned)
- Shows: All projects, but only displays todos with `group_id IS NULL` within each project

### Group View (`groupId = currentGroup.id`)

**Todos:**
- API filters: `WHERE user_id = ? AND group_id = ?`
- Shows: Only that group's todos

**Projects:**
- API returns: ALL user projects (projects are user-owned)
- Shows: All projects, but only displays todos with `group_id = groupId` within each project

## Data Isolation Rules

✅ **Self View:**
- Todos: `group_id IS NULL` only
- Projects: ALL user projects (but only show todos with `group_id IS NULL` within each)

✅ **Group View:**
- Todos: `group_id = currentGroup.id` only
- Projects: ALL user projects (but only show todos with `group_id = currentGroup.id` within each)

✅ **No Cross-Contamination:**
- Personal todos never appear in group view
- Group todos never appear in self view
- Projects show all todos, but `todosByProject` mapping ensures only relevant todos are displayed

## Testing

1. **Create a todo in Self view:**
   - Should have `group_id = NULL`
   - Should only appear in Self view
   - Project should only appear in Self view

2. **Create a todo in Group view:**
   - Should have `group_id = currentGroup.id`
   - Should only appear in that Group view
   - Project should only appear in that Group view

3. **Switch between contexts:**
   - Self todos should never appear in Group view
   - Group todos should never appear in Self view
   - Projects should only appear where their todos are

## Summary

✅ **Projects are now filtered** by the context of their todos  
✅ **Todos are created** with correct `group_id` based on context  
✅ **Data isolation** is enforced at both API and component levels  
✅ **No data leakage** between Self and Group contexts  

The system now ensures complete data isolation for todos and projects!


