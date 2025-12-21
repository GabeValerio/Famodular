"use client";

import { ChatPage } from '@/app/modules/chat';
import { useGroup } from '@/lib/GroupContext';
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';

export default function ChatRoute() {
  const { currentGroup, isSelfView } = useGroup();
  const { enabled, AccessDenied } = useModuleAccess('chat');

  if (!enabled) {
    return AccessDenied ? <AccessDenied /> : null;
  }

  // Chat requires a group - don't show in self view
  if (isSelfView || !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Chat Requires a Group</h2>
          <p className="text-muted-foreground">
            Please select a group to view and send messages.
          </p>
        </div>
      </div>
    );
  }

  return <ChatPage groupId={currentGroup.id} />;
}
