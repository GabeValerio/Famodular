// Export dashboard widgets for core group features
import { GroupMembersWidget } from '../components/GroupMembersWidget';
import { registerWidget } from '../registry/widgetRegistry';

// Register the group members widget
// This widget is always shown for groups regardless of module settings
registerWidget({
  id: 'group-members',
  moduleId: 'calendar', // Using calendar as it's always enabled
  title: 'Group Members',
  description: 'View group members and their currently reading books',
  component: GroupMembersWidget,
  size: 'medium',
  order: 1,
  defaultEnabled: true,
});

// Export for direct use if needed
export { GroupMembersWidget };
