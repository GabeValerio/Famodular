# Module Category Explanation

## Current Problem

The system currently restricts modules based on a `category` field:
- **User modules** (`category: 'user'`) can only be enabled in self view
- **Group modules** (`category: 'group'`) can only be enabled in group view

This is **too restrictive**. For example:
- **Todos** module supports personal, work, AND group todos - it should work in both contexts
- **Calendar** could be personal OR shared - should work in both contexts
- **Check-ins** could be personal OR group - should work in both contexts

## Solution: Remove Category Restrictions

The `category` field should be **informational only** (describing the module's primary use case), not a restriction on where it can be used.

### Changes Needed:

1. **Remove category checks** from `isModuleEnabled()` - allow any module in any context
2. **Update types** - Both `UserModules` and `GroupModules` should include all modules
3. **Settings UI** - Show all modules in both Personal and Group settings
4. **Keep category field** - For documentation/metadata, but don't enforce restrictions

## Why This Makes Sense

- **Todos**: Already supports personal, work, and group categories - should be configurable in both contexts
- **Calendar**: Can be personal calendar OR shared group calendar
- **Check-ins**: Could be personal mood tracking OR group check-ins
- **Flexibility**: Users and groups should decide what features they want, not be restricted by arbitrary categories

## Implementation

Modules will be **context-aware** but not **category-restricted**:
- A module checks if it's in self view or group view
- It adapts its behavior accordingly (e.g., todos shows personal todos in self view, group todos in group view)
- But the module itself can be enabled/disabled in either context







