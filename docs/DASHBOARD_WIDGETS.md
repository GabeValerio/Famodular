# Dashboard Widgets System

## Overview

Modules can provide dashboard widgets that appear on the main dashboard page. This allows each module to contribute customizable widgets that users can enable/disable and reorder per group.

## Architecture

```
Module Structure with Widgets:
modules/group/checkins/
├── widgets/
│   ├── CheckInsWidget.tsx    # Widget component
│   └── index.ts               # Registers widget
├── components/
├── hooks/
└── index.ts                    # Imports widgets (triggers registration)
```

## How It Works

### 1. Module Creates Widget

**File: `modules/group/checkins/widgets/CheckInsWidget.tsx`**

```typescript
"use client";

import { DashboardWidgetProps } from '@/app/components/modules/shared/types/dashboard';
import { useCheckIns } from '../hooks/useCheckIns';

export function CheckInsWidget({ groupId }: DashboardWidgetProps) {
  const { checkIns, loading } = useCheckIns(groupId);
  
  // Widget UI
  return <Card>...</Card>;
}
```

### 2. Register Widget

**File: `modules/group/checkins/widgets/index.ts`**

```typescript
import { CheckInsWidget } from './CheckInsWidget';
import { registerWidget } from '@/app/components/modules/shared/registry/widgetRegistry';

registerWidget({
  id: 'checkins-summary',
  moduleId: 'checkins',
  title: 'Check-ins Summary',
  description: 'Recent family check-ins',
  component: CheckInsWidget,
  size: 'small',              // 'small' | 'medium' | 'large' | 'full'
  order: 1,
  defaultEnabled: true,
});
```

### 3. Module Exports Widgets

**File: `modules/group/checkins/index.ts`**

```typescript
// ... other exports ...

// Import widgets to trigger registration
import './widgets';
```

### 4. Dashboard Uses Widgets

**File: `app/dashboard/page.tsx`**

```typescript
import { useDashboardWidgets } from '@/app/components/modules/shared/hooks/useDashboardWidgets';

export default function DashboardPage() {
  const { enabledWidgets } = useDashboardWidgets();
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {enabledWidgets.map(widget => {
        const WidgetComponent = widget.component;
        return <WidgetComponent key={widget.id} groupId={groupId} />;
      })}
    </div>
  );
}
```

## Widget Sizes

- **small**: 1/3 width (3-column grid)
- **medium**: 1/2 width (2-column grid)
- **large**: 1/2 width but taller
- **full**: Full width

## Widget Configuration

Each group can configure which widgets to show:

```typescript
interface DashboardWidgetConfig {
  widgetId: string;
  enabled: boolean;        // Show/hide
  order: number;          // Display order
  customSettings?: {      // Module-specific
    limit?: number;
    showDetails?: boolean;
  };
}
```

## Customization Features

### Per-Group Widget Settings

Groups can:
- ✅ Enable/disable widgets
- ✅ Reorder widgets
- ✅ Customize widget settings (e.g., show count, limit items)

### Widget Registry

- Central registry tracks all widgets
- Filters by enabled modules
- Sorts by order
- Provides widget metadata

## Benefits

✅ **Modular**: Each module owns its widgets
✅ **Flexible**: Users control what appears
✅ **Reusable**: Widgets use module hooks/services
✅ **Type-safe**: Full TypeScript support
✅ **Customizable**: Per-group configuration

## Adding Widget Configuration to Settings

You can add widget configuration to the settings page:

```typescript
// In settings page
<Card>
  <CardHeader>
    <CardTitle>Dashboard Widgets</CardTitle>
  </CardHeader>
  <CardContent>
    {availableWidgets.map(widget => (
      <div key={widget.id}>
        <Switch
          checked={widgetConfigs[widget.id]?.enabled}
          onCheckedChange={(enabled) => {
            // Update widget config
          }}
        />
        <Label>{widget.title}</Label>
      </div>
    ))}
  </CardContent>
</Card>
```

## Example: Complete Widget Implementation

```typescript
// 1. Create widget component
export function MyModuleWidget({ groupId }: DashboardWidgetProps) {
  const { data, loading } = useMyModule(groupId);
  return <Card>...</Card>;
}

// 2. Register widget
registerWidget({
  id: 'my-module-widget',
  moduleId: 'mymodule',
  title: 'My Module Summary',
  component: MyModuleWidget,
  size: 'small',
  order: 5,
  defaultEnabled: true,
});

// 3. Import in module index.ts
import './widgets';
```

## Summary

- **Widgets live in `modules/[module]/widgets/`**
- **Widgets register themselves on import**
- **Dashboard automatically shows widgets from enabled modules**
- **Groups can customize which widgets appear**
- **Each widget uses its module's hooks and services**

This gives modules complete flexibility to add dashboard widgets while keeping everything organized and type-safe!


