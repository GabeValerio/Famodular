"use client";

import { useGroup } from "@/lib/GroupContext";
import { useDashboardWidgets } from "@/app/modules/shared/hooks/useDashboardWidgets";
import { Card } from "@/app/components/ui/card";
// Import modules to register their widgets
import "@/app/modules/shared";
// Import shared widgets to ensure they are registered
import "@/app/modules/shared/widgets";

export default function DashboardPage() {
  const { currentGroup } = useGroup();
  const { enabledWidgets } = useDashboardWidgets();

  // Group widgets by size for layout
  const smallWidgets = enabledWidgets.filter(w => w.size === 'small');
  const mediumWidgets = enabledWidgets.filter(w => w.size === 'medium');
  const largeWidgets = enabledWidgets.filter(w => w.size === 'large');
  const fullWidgets = enabledWidgets.filter(w => w.size === 'full');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Welcome to {currentGroup?.name || 'your group'}
        </p>
      </div>

      {/* Full-width widgets */}
      {fullWidgets.length > 0 && (
        <div className="space-y-4">
          {fullWidgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <WidgetComponent key={widget.id} groupId={currentGroup?.id || ''} />
            );
          })}
        </div>
      )}

      {/* Small widgets grid */}
      {smallWidgets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {smallWidgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <WidgetComponent key={widget.id} groupId={currentGroup?.id || ''} />
            );
          })}
        </div>
      )}

      {/* Medium widgets */}
      {mediumWidgets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {mediumWidgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <WidgetComponent key={widget.id} groupId={currentGroup?.id || ''} />
            );
          })}
        </div>
      )}

      {/* Large widgets */}
      {largeWidgets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {largeWidgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <WidgetComponent key={widget.id} groupId={currentGroup?.id || ''} />
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {enabledWidgets.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No dashboard widgets available. Enable modules in settings to see widgets.
          </p>
        </Card>
      )}
    </div>
  );
}
