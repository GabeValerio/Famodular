// Types for dashboard widgets
import React from 'react';
import { ModuleId } from '../../registry';

export interface DashboardWidget {
  id: string;
  moduleId: ModuleId;
  title: string;
  description?: string;
  component: React.ComponentType<DashboardWidgetProps>;
  size: 'small' | 'medium' | 'large' | 'full';
  order?: number; // For custom ordering
  defaultEnabled?: boolean; // Whether widget is enabled by default
}

export interface DashboardWidgetProps {
  groupId: string;
}

export interface DashboardWidgetConfig {
  widgetId: string;
  enabled: boolean;
  order: number;
  customSettings?: Record<string, any>;
}
