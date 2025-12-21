# Data Isolation Summary

## What Was Fixed

All module routes now enforce **complete data isolation** between Self and Group contexts.

---

## Key Changes

### 1. Route Pages Updated

All route pages in `app/dashboard/*/page.tsx` now:

- ✅ Check `isSelfView` to determine context
- ✅ Never pass empty string `''` as groupId (use `null` instead)
- ✅ Show appropriate messages for modules that require groups
- ✅ Pass correct `groupId` (null for self, group.id for group)

### 2. Data Filtering Rules

**Self View (`isSelfView === true` or `currentGroup === null`):**
- Pass `groupId: null` or `undefined` to modules
- API filters: `WHERE user_id = ? AND group_id IS NULL`
- Shows: Only personal data

**Group View (`currentGroup !== null`):**
- Pass `groupId: currentGroup.id` to modules
- API filters: `WHERE user_id = ? AND group_id = ?`
- Shows: Only that group's data

---

## Module Behavior

### Group-Only Modules (Blocked in Self View)

These modules show a message in self view:
- **Check-ins** - "Check-ins Require a Group"
- **Chat** - "Chat Requires a Group"
- **Wishlist** - "Wishlist Requires a Group"
- **Location** - "Location Sharing Requires a Group"

### Dual-Context Modules (Data Filtered)

These modules work in both contexts but show different data:
- **Todos** - Personal todos in self, group todos in group view
- **Calendar** - Personal calendar in self, group calendar in group view
- **Finance** - Personal finance in self, group finance in group view
- **Goals** - Personal goals in self, group goals in group view

---

## Example: Todos Module

### Self View
```typescript
// Route passes: groupId = null
<TodosPage /> // Gets currentGroup internally, passes null

// API call: /api/modules/user/todos?groupId=null
// Query: WHERE user_id = ? AND group_id IS NULL
// Result: Only personal todos
```

### Group View
```typescript
// Route passes: groupId = currentGroup.id
<TodosPage /> // Gets currentGroup.id, passes it

// API call: /api/modules/user/todos?groupId=abc-123
// Query: WHERE user_id = ? AND group_id = 'abc-123'
// Result: Only that group's todos
```

---

## Security

✅ **No Data Leakage:**
- Personal data never visible in group view
- Group data never visible in self view
- Other groups' data never visible when viewing a specific group

✅ **Proper Filtering:**
- All API routes verify group membership
- All queries filter by `group_id` appropriately
- Never use empty string as groupId (use null/undefined)

---

## Testing

To verify data isolation:

1. **Self View:**
   - Switch to "Self" in dropdown
   - Open Todos → Should see only personal todos
   - Open Calendar → Should see only personal calendar
   - Try Check-ins → Should see "Requires a Group" message

2. **Group View:**
   - Select a group
   - Open Todos → Should see only that group's todos
   - Open Check-ins → Should see only that group's check-ins
   - Switch to another group → Data should change

3. **No Cross-Contamination:**
   - Personal todos should never appear in group view
   - Group check-ins should never appear in self view
   - Data from Group A should never appear when viewing Group B

---

## Summary

✅ **Complete data isolation** between Self and Group contexts  
✅ **Group-only modules** blocked in self view with clear messages  
✅ **Dual-context modules** properly filter data based on context  
✅ **No empty strings** - always use null/undefined for self view  
✅ **Security enforced** - proper filtering at API level  

The system now ensures you can **never see data from one context when viewing another context**.

