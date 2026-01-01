# Data Isolation - Core Principle for All Modules

## Core Principle

**Data isolation between Self and Group contexts is a FUNDAMENTAL requirement for ALL modules.**

**NO module should EVER cross-contaminate data between:**
- Self view and Group view
- Different groups
- Personal data and group data

---

## The Rule

### ✅ CORRECT: Data Isolation Enforced

**Self View (`groupId = null`):**
- Show ONLY data where `group_id IS NULL`
- Never show any group data
- Never show data from any group

**Group View (`groupId = <group_uuid>`):**
- Show ONLY data where `group_id = <group_uuid>`
- Never show personal data (`group_id IS NULL`)
- Never show data from other groups (`group_id != <group_uuid>`)

### ❌ WRONG: Data Cross-Contamination

- Showing personal todos in group view
- Showing group projects in self view
- Showing Group A's data when viewing Group B
- Any data appearing in the wrong context

---

## Implementation Requirements

### 1. Database Schema

**Every module table MUST have:**
- `user_id UUID` - The owner of the data
- `group_id UUID` - NULL for self/personal, UUID for group (with foreign key to `groups` table)

**Example:**
```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  -- ... other fields
);

-- Indexes for efficient filtering
CREATE INDEX idx_todos_user_group ON todos(user_id, group_id);
CREATE INDEX idx_todos_group_id ON todos(group_id);
```

### 2. API Routes

**Every GET endpoint MUST:**
1. Accept `groupId` query parameter (or from request body)
2. Normalize `groupId` (treat empty string as `null`)
3. Filter strictly by `group_id`:
   - If `groupId = null`: `WHERE user_id = ? AND group_id IS NULL`
   - If `groupId = <uuid>`: `WHERE user_id = ? AND group_id = ?`
4. Verify group membership if `groupId` is provided

**Example:**
```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const groupIdParam = searchParams.get('groupId');
  
  // CRITICAL: Normalize groupId
  const groupId = groupIdParam && groupIdParam.trim() !== '' 
    ? groupIdParam 
    : null;

  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', session.user.id);

  // CRITICAL: Filter by group_id for data isolation
  if (groupId) {
    // Verify membership
    const { data: member } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .single();
    
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    query = query.eq('group_id', groupId); // Group view
  } else {
    query = query.is('group_id', null); // Self view
  }

  const { data, error } = await query;
  // ...
}
```

### 3. POST/PATCH Endpoints

**Every create/update endpoint MUST:**
1. Accept `groupId` from request body
2. Normalize `groupId` (treat empty string as `null`)
3. Set `group_id` in database:
   - `group_id = null` for self view
   - `group_id = <group_uuid>` for group view
4. Verify group membership if `groupId` is provided

**Example:**
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { title, groupId } = body;

  // CRITICAL: Normalize groupId
  const normalizedGroupId = groupId && groupId.trim() !== '' 
    ? groupId 
    : null;

  // Verify membership if groupId provided
  if (normalizedGroupId) {
    const { data: member } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', normalizedGroupId)
      .eq('user_id', session.user.id)
      .single();
    
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const newItem = {
    title,
    user_id: session.user.id,
    // CRITICAL: Set group_id for data isolation
    group_id: normalizedGroupId,
    // ... other fields
  };

  const { data, error } = await supabase
    .from('todos')
    .insert(newItem)
    .select()
    .single();
  // ...
}
```

### 4. Frontend Components

**Every module component MUST:**
1. Get `groupId` from context (via `useGroup()`)
2. Pass `groupId` to API calls (never empty string, use `null` or `undefined`)
3. Never mix data from different contexts

**Example:**
```typescript
export function TodosPage() {
  const { currentGroup, isSelfView } = useGroup();
  
  // CRITICAL: Normalize groupId
  const groupId = isSelfView || !currentGroup 
    ? null 
    : currentGroup.id;

  const { todos } = useTodos(groupId);
  // ...
}
```

### 5. Service Layer

**Every service function MUST:**
1. Accept `groupId` parameter
2. Only append `groupId` to URL if it's a valid non-empty string
3. Never send empty strings (let API treat as `null`)

**Example:**
```typescript
async getTodos(category?: string, groupId?: string | null): Promise<Todo[]> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  
  // CRITICAL: Only append if valid non-empty string
  if (groupId && groupId.trim() !== '') {
    params.append('groupId', groupId);
  }
  // null/undefined/empty string = API treats as self view
  
  const url = params.toString() 
    ? `${API_BASE}?${params.toString()}` 
    : API_BASE;
  // ...
}
```

---

## Module Checklist

For every module, verify:

- [ ] Database table has `group_id` column (nullable, with foreign key)
- [ ] Database has indexes on `(user_id, group_id)` and `group_id`
- [ ] GET endpoint filters by `group_id` (NULL for self, UUID for group)
- [ ] POST endpoint sets `group_id` based on context
- [ ] PATCH endpoint preserves `group_id` (or allows updating it with verification)
- [ ] DELETE endpoint filters by `group_id` to prevent cross-context deletion
- [ ] Frontend passes `groupId` correctly (null for self, group.id for group)
- [ ] Service layer handles `groupId` correctly (never empty strings)
- [ ] No data appears in wrong context

---

## Testing Data Isolation

### Test 1: Self View Isolation
1. Switch to "Self" view
2. Create data in a module
3. Switch to any group view
4. **Verify:** Self data does NOT appear

### Test 2: Group View Isolation
1. Switch to Group A
2. Create data in a module
3. Switch to Group B
4. **Verify:** Group A data does NOT appear in Group B

### Test 3: Cross-Contamination Prevention
1. Create personal data in Self view
2. Create group data in Group A
3. View Self → Should see ONLY personal data
4. View Group A → Should see ONLY Group A data
5. View Group B → Should see NO data from Self or Group A

---

## Current Module Status

### ✅ Implemented (Data Isolation Enforced)
- **Todos** - Projects and todos isolated by `group_id`
- **Calendar** - Events isolated by `group_id`
- **Finance** - Transactions isolated by `group_id`
- **Goals** - Goals isolated by `group_id`

### ⚠️ Group-Only Modules (Blocked in Self View)
- **Check-ins** - Requires group, blocked in self view
- **Chat** - Requires group, blocked in self view
- **Wishlist** - Requires group, blocked in self view
- **Location** - Requires group, blocked in self view

### 🔍 Needs Review
- All other modules should be audited to ensure data isolation

---

## Summary

**Data isolation is NOT optional - it's a CORE PRINCIPLE.**

Every module MUST:
1. Store `group_id` in database (NULL for self, UUID for group)
2. Filter by `group_id` in all queries
3. Set `group_id` correctly when creating data
4. Never show data from wrong context

**If a module doesn't enforce data isolation, it's a BUG that must be fixed.**





