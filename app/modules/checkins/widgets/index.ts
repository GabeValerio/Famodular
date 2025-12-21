// Export dashboard widgets for this module
import { ShareFeelingWidget } from './ShareFeelingWidget';
import { registerWidget } from '@/app/modules/shared/registry/widgetRegistry';

// Register the widget
registerWidget({
  id: 'share-feeling',
  moduleId: 'checkins',
  title: "Share how you're feeling",
  description: 'Quick check-in with mood and note',
  component: ShareFeelingWidget,
  size: 'medium',
  order: 0,
  defaultEnabled: true,
});

// Export for direct use if needed
export { ShareFeelingWidget };
