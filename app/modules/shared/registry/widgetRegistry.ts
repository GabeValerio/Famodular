// Dashboard Widget Registry
import { DashboardWidget } from '../types/dashboard';
import { ModuleId as RegistryModuleId } from '../../registry';

// Registry to store all available dashboard widgets
const widgetRegistry = new Map<string, DashboardWidget>();

export function registerWidget(widget: DashboardWidget) {
  widgetRegistry.set(widget.id, widget);
}

export function getWidgetsForModule(moduleId: RegistryModuleId): DashboardWidget[] {
  return Array.from(widgetRegistry.values())
    .filter(widget => widget.moduleId === moduleId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getAllWidgets(): DashboardWidget[] {
  return Array.from(widgetRegistry.values())
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getWidget(widgetId: string): DashboardWidget | undefined {
  return widgetRegistry.get(widgetId);
}
