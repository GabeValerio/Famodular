# Module Configuration Per Group

## Overview

Each group can enable or disable specific modules. This allows different families/groups to customize which features they want to use.

---

## 1. Database Schema

Add a `modules` configuration to the `groups` table:

```sql
-- Add modules configuration column
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

---

## 2. Update TypeScript Types

**File: `types/family.ts`**

```typescript
export interface GroupModules {
  checkins: boolean;
  finance: boolean;
  goals: boolean;
  chat: boolean;
  wishlist: boolean;
  location: boolean;
  calendar: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  privacy: 'public' | 'private' | 'invite-only';
  members: GroupMember[];
  enabledModules?: GroupModules; // Module configuration
}
```

---

## 3. Module Registry

**File: `app/components/modules/registry.ts`**

```typescript
import { GroupModules } from '@/types/family';

export type ModuleId = keyof GroupModules;

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  icon: React.ComponentType;
  category: 'group' | 'user';
  defaultEnabled: boolean;
}

// Registry of all available modules
export const MODULE_REGISTRY: Record<ModuleId, ModuleDefinition> = {
  checkins: {
    id: 'checkins',
    name: 'Check-ins',
    description: 'Share feelings and daily updates',
    icon: HeartHandshake,
    category: 'group',
    defaultEnabled: true,
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    description: 'Track expenses and savings',
    icon: Wallet,
    category: 'group',
    defaultEnabled: true,
  },
  goals: {
    id: 'goals',
    name: 'Goals',
    description: 'Set and track family goals',
    icon: Target,
    category: 'group',
    defaultEnabled: true,
  },
  chat: {
    id: 'chat',
    name: 'Chat',
    description: 'Family messaging',
    icon: MessagesSquare,
    category: 'group',
    defaultEnabled: true,
  },
  wishlist: {
    id: 'wishlist',
    name: 'Wishlist',
    description: 'Share wants and needs',
    icon: ShoppingBag,
    category: 'group',
    defaultEnabled: true,
  },
  location: {
    id: 'location',
    name: 'Location',
    description: 'Share locations',
    icon: Map,
    category: 'group',
    defaultEnabled: true,
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    description: 'Shared calendar events',
    icon: Calendar,
    category: 'user',
    defaultEnabled: true,
  },
};

// Helper to get enabled modules for a group
export function getEnabledModules(group: Group): ModuleId[] {
  const modules = group.enabledModules || {};
  return Object.entries(modules)
    .filter(([_, enabled]) => enabled)
    .map(([id]) => id as ModuleId);
}

// Check if a module is enabled
export function isModuleEnabled(group: Group, moduleId: ModuleId): boolean {
  return group.enabledModules?.[moduleId] ?? MODULE_REGISTRY[moduleId].defaultEnabled;
}
```

---

## 4. Dynamic Navigation

**File: `app/components/dashboard/Navbar.tsx`**

```typescript
"use client";

import { useGroup } from "@/lib/GroupContext";
import { MODULE_REGISTRY, isModuleEnabled } from "@/app/components/modules/registry";
import { ModuleId } from "@/app/components/modules/registry";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    alwaysVisible: true, // Always show dashboard
  },
  {
    moduleId: "calendar" as ModuleId,
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    moduleId: "location" as ModuleId,
    title: "Location",
    href: "/dashboard/location",
    icon: Map,
  },
  {
    moduleId: "goals" as ModuleId,
    title: "Goals",
    href: "/dashboard/goals",
    icon: Target,
  },
  {
    moduleId: "finance" as ModuleId,
    title: "Finance",
    href: "/dashboard/finance",
    icon: Wallet,
  },
  {
    moduleId: "checkins" as ModuleId,
    title: "Check-ins",
    href: "/dashboard/checkins",
    icon: HeartHandshake,
  },
  {
    moduleId: "chat" as ModuleId,
    title: "Chat",
    href: "/dashboard/chat",
    icon: MessagesSquare,
  },
  {
    moduleId: "wishlist" as ModuleId,
    title: "Wishlist",
    href: "/dashboard/wishlist",
    icon: ShoppingBag,
  },
];

export function Sidebar({ className }: { className?: string }) {
  const { currentGroup } = useGroup();
  const pathname = usePathname();

  // Filter items based on enabled modules
  const visibleItems = sidebarItems.filter(item => {
    if (item.alwaysVisible) return true;
    if (item.moduleId) {
      return isModuleEnabled(currentGroup, item.moduleId);
    }
    return true;
  });

  return (
    <div className={cn("border-b bg-background", className)}>
      <div className="px-4 py-4">
        <div className="flex items-center space-x-6">
          {/* ... group selector ... */}
          
          {/* Navigation Items - only show enabled modules */}
          <div className="flex items-center space-x-2 overflow-x-auto flex-1">
            {visibleItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="flex flex-col items-center h-auto p-2 min-w-[80px] border-0 hover:bg-accent"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 mb-1" />
                  <span className="text-xs text-center leading-tight">{item.title}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Protected Routes

**File: `app/dashboard/checkins/page.tsx`**

```typescript
"use client";

import { CheckInsPage } from '@/app/components/modules/group/checkins';
import { useGroup } from '@/lib/GroupContext';
import { isModuleEnabled } from '@/app/components/modules/registry';
import { notFound } from 'next/navigation';

export default function CheckInsRoute() {
  const { currentGroup } = useGroup();

  // Check if module is enabled for this group
  if (!isModuleEnabled(currentGroup, 'checkins')) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Module Disabled</h2>
        <p className="text-muted-foreground">
          Check-ins are not enabled for this group.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Ask a group admin to enable this module in settings.
        </p>
      </div>
    );
  }

  return <CheckInsPage groupId={currentGroup.id} />;
}
```

---

## 6. Module Settings UI

**File: `app/dashboard/settings/page.tsx`** (add new tab)

```typescript
import { MODULE_REGISTRY, ModuleId } from '@/app/components/modules/registry';
import { useGroup } from '@/lib/GroupContext';

export default function SettingsPage() {
  const { currentGroup, updateGroup } = useGroup();
  const [moduleSettings, setModuleSettings] = useState(
    currentGroup.enabledModules || {}
  );

  const handleToggleModule = async (moduleId: ModuleId) => {
    const newSettings = {
      ...moduleSettings,
      [moduleId]: !moduleSettings[moduleId],
    };
    
    setModuleSettings(newSettings);
    
    // Update in database
    await updateGroup({
      ...currentGroup,
      enabledModules: newSettings,
    });
  };

  return (
    <TabsContent value="modules" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enabled Modules</CardTitle>
          <CardDescription>
            Choose which features are available for this group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(MODULE_REGISTRY).map((module) => (
              <div
                key={module.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <module.icon className="h-5 w-5" />
                  <div>
                    <h3 className="font-medium">{module.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={moduleSettings[module.id] ?? module.defaultEnabled}
                  onCheckedChange={() => handleToggleModule(module.id)}
                  disabled={!isAdmin} // Only admins can change
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
```

---

## 7. Hook for Module Access

**File: `app/components/modules/shared/hooks/useModuleAccess.ts`**

```typescript
import { useGroup } from '@/lib/GroupContext';
import { isModuleEnabled, ModuleId } from '@/app/components/modules/registry';

export function useModuleAccess(moduleId: ModuleId) {
  const { currentGroup } = useGroup();
  const enabled = isModuleEnabled(currentGroup, moduleId);
  
  return {
    enabled,
    group: currentGroup,
    // Helper to show access denied message
    AccessDenied: enabled ? null : () => (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Module Disabled</h2>
        <p className="text-muted-foreground">
          This module is not enabled for {currentGroup.name}.
        </p>
      </div>
    ),
  };
}
```

**Usage in a module:**

```typescript
export function CheckInsPage({ groupId }: { groupId: string }) {
  const { enabled, AccessDenied } = useModuleAccess('checkins');
  
  if (!enabled) {
    return <AccessDenied />;
  }
  
  // ... rest of component
}
```

---

## 8. API Route for Updating Modules

**File: `app/api/groups/[groupId]/modules/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = params;
    const { enabledModules } = await request.json();

    // Verify user is admin of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', session.user.id)
      .single();

    if (!membership || membership.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update group modules
    const { data, error } = await supabase
      .from('groups')
      .update({ enabled_modules: enabledModules })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 9. Example Use Cases

### Default Group Setup
```json
{
  "checkins": false,
  "finance": false,
  "goals": false,
  "chat": true,
  "wishlist": false,
  "location": false,
  "calendar": true,
  "todos": false
}
```

### Family A: Full Features
```json
{
  "checkins": true,
  "finance": true,
  "goals": true,
  "chat": true,
  "wishlist": true,
  "location": true,
  "calendar": true,
  "todos": true
}
```

### Family B: Communication Focused
```json
{
  "checkins": true,
  "finance": false,
  "goals": false,
  "chat": true,
  "wishlist": false,
  "location": false,
  "calendar": true,
  "todos": false
}
```

---

## 10. Benefits

✅ **Customization**: Each group can choose what features they need
✅ **Privacy**: Groups can disable features they don't want
✅ **Performance**: Disabled modules don't load unnecessary code
✅ **Flexibility**: Easy to add new modules and let groups opt-in
✅ **User Experience**: Cleaner UI with only relevant features

---

## Summary

- **Database**: Store `enabled_modules` JSONB column on groups table
- **Types**: Add `enabledModules` to Group interface
- **Registry**: Create module registry with metadata
- **Navigation**: Filter nav items based on enabled modules
- **Routes**: Protect routes by checking module access
- **Settings**: Allow admins to toggle modules on/off
- **API**: Endpoint to update module configuration

This gives each group full control over which modules they use!

