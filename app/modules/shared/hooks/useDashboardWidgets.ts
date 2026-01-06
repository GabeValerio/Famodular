"use client";

import { useMemo } from 'react';
import { useGroup } from '@/lib/GroupContext';
import { isModuleEnabled } from '../../registry';
import { getAllWidgets, getWidgetsForModule } from '../registry/widgetRegistry';
import { DashboardWidgetConfig } from '../types/dashboard';

export function useDashboardWidgets() {
  const { currentGroup, currentUser, isSelfView } = useGroup();

  // Get widgets for enabled modules
  const availableWidgets = useMemo(() => {
    const allWidgets = getAllWidgets();

    // Special case: always include group-members widget for groups
    const filteredWidgets = allWidgets.filter(widget => {
      if (widget.id === 'group-members') {
        return currentGroup !== null && !isSelfView;
      }
      // Only show widgets from enabled modules
      return isModuleEnabled(currentGroup, widget.moduleId, currentUser);
    });

    return filteredWidgets;
  }, [currentGroup, currentUser, isSelfView]);

  // Get widget configuration from group settings (if stored)
  const widgetConfigs = useMemo(() => {
    // TODO: Load from group.enabledWidgets or group.dashboardConfig
    // For now, return default configs
    return availableWidgets.map(widget => ({
      widgetId: widget.id,
      enabled: widget.defaultEnabled ?? true,
      order: widget.order ?? 0,
    } as DashboardWidgetConfig));
  }, [availableWidgets]);

  // Get enabled widgets sorted by order
  const enabledWidgets = useMemo(() => {
    return availableWidgets
      .filter(widget => {
        const config = widgetConfigs.find(c => c.widgetId === widget.id);
        return config?.enabled ?? widget.defaultEnabled ?? true;
      })
      .sort((a, b) => {
        const configA = widgetConfigs.find(c => c.widgetId === a.id);
        const configB = widgetConfigs.find(c => c.widgetId === b.id);
        const orderA = configA?.order ?? a.order ?? 0;
        const orderB = configB?.order ?? b.order ?? 0;
        return orderA - orderB;
      });
  }, [availableWidgets, widgetConfigs]);

  return {
    availableWidgets,
    enabledWidgets,
    widgetConfigs,
  };
}
