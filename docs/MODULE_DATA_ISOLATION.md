# Module Data Isolation - Self vs Group

## Requirement

**Data must be completely isolated between Self and Group contexts:**

- **Self View**: Show ONLY personal/user data (no group data visible)
- **Group View**: Show ONLY that specific group's data (no personal data, no other groups' data)

**You should NEVER see data from one context when viewing another context.**

---

## Implementation Status

✅ **Fixed:** All route pages now enforce data isolation

### Modules That Require a Group (Blocked in Self View)
- **Check-ins**: Shows "Requires a Group" message in self view
- **Chat**: Shows "Requires a Group" message in self view  
- **Wishlist**: Shows "Requires a Group" message in self view
- **Location**: Shows "Requires a Group" message in self view

### Modules That Work in Both Contexts (Data Filtered)
- **Todos**: 
  - Self view: `groupId = null` → Shows personal todos only
  - Group view: `groupId = currentGroup.id` → Shows that group's todos only
- **Calendar**:
  - Self view: `groupId = null` → Shows personal calendar only
  - Group view: `groupId = currentGroup.id` → Shows that group's calendar only
- **Finance**:
  - Self view: `groupId = null` → Shows personal finance only
  - Group view: `groupId = currentGroup.id` → Shows that group's finance only
- **Goals**:
  - Self view: `groupId = null` → Shows personal goals only
  - Group view: `groupId = currentGroup.id` → Shows that group's goals only

---

## Module Data Filtering Rules

### Self View (`currentGroup === null`)

**Allowed Data:**
- Personal todos (`group_id IS NULL`)
- Personal calendar events
- Personal check-ins (if supported)
- Personal finance data
- Personal goals
- Personal chat messages (if supported)

**Forbidden Data:**
- Any data with `group_id` set
- Data from any groups

### Group View (`currentGroup !== null`)

**Allowed Data:**
- Only data where `group_id = currentGroup.id`
- Group-specific todos
- Group calendar events
- Group check-ins
- Group finance data
- Group goals
- Group chat messages

**Forbidden Data:**
- Personal data (`group_id IS NULL`)
- Data from other groups (`group_id != currentGroup.id`)

---

## Implementation Checklist

### For Each Module:

1. **Check if module requires group:**
   - If yes: Don't render in self view (show "Module requires a group" message)
   - If no: Continue

2. **Data Fetching:**
   - Self view: Pass `groupId: null` or `undefined` to API
   - Group view: Pass `groupId: currentGroup.id` to API

3. **API Routes:**
   - Self view: Filter to `group_id IS NULL` or `user_id = session.user.id AND group_id IS NULL`
   - Group view: Filter to `group_id = providedGroupId` AND verify user is member

4. **UI Display:**
   - Self view: Show "Personal" or "My" prefix
   - Group view: Show group name or context

---

## Examples

### ✅ Correct: Todos Module

**Self View:**
```typescript
// Pass undefined/null for groupId
useTodos(undefined) 
// API filters: WHERE user_id = ? AND group_id IS NULL
// Shows: Only personal todos
```

**Group View:**
```typescript
// Pass currentGroup.id
useTodos(currentGroup.id)
// API filters: WHERE user_id = ? AND group_id = ?
// Shows: Only that group's todos
```

### ✅ Correct: Check-ins Module

**Self View:**
```typescript
// Don't render - requires group
if (!currentGroup) {
  return <div>Check-ins require a group</div>;
}
```

**Group View:**
```typescript
// Pass currentGroup.id
useCheckIns(currentGroup.id)
// API filters: WHERE group_id = ?
// Shows: Only that group's check-ins
```

---

## Database Queries

### Self View Queries
```sql
-- Personal todos
SELECT * FROM todos 
WHERE user_id = ? AND group_id IS NULL;

-- Personal calendar
SELECT * FROM calendar_events 
WHERE user_id = ? AND group_id IS NULL;
```

### Group View Queries
```sql
-- Group todos
SELECT * FROM todos 
WHERE user_id = ? AND group_id = ?;

-- Group check-ins
SELECT * FROM check_ins 
WHERE group_id = ?;

-- Verify membership
SELECT * FROM group_members 
WHERE group_id = ? AND user_id = ?;
```

---

## Security Considerations

1. **Always verify group membership** before showing group data
2. **Never show data from groups user is not a member of**
3. **Personal data should only be visible to the owner**
4. **Group data should only be visible to group members**

---

## Testing Checklist

For each module, test:

- [ ] Self view shows only personal data
- [ ] Group view shows only that group's data
- [ ] Switching between groups shows different data
- [ ] Switching to self view shows personal data
- [ ] No data leakage between contexts
- [ ] API properly filters by context




