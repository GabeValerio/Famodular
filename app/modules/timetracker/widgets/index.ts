// Export dashboard widgets for this module
import { TimeTrackerWidget } from './TimeTrackerWidget';
import { registerWidget } from '@/app/modules/shared/registry/widgetRegistry';

// Register the widget
registerWidget({
  id: 'time-tracker',
  moduleId: 'timetracker',
  title: 'Time Tracker',
  description: 'Track your time and view productivity stats',
  component: TimeTrackerWidget,
  size: 'medium',
  order: 0,
  defaultEnabled: true,
});

// Export for direct use if needed
export { TimeTrackerWidget };
