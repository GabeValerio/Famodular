"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { MessagesSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useChat } from '../hooks/useChat';
import { DashboardWidgetProps } from '@/app/modules/shared/types/dashboard';
import { formatRelativeTime } from '@/app/modules/shared/utils';

export function ChatWidget({ groupId }: DashboardWidgetProps) {
  const { messages, loading } = useChat(groupId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessagesSquare className="h-4 w-4" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const recentMessages = messages.slice(-3).reverse();

  return (
    <Link href="/dashboard/chat" className="block">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessagesSquare className="h-4 w-4" />
            Chat
          </CardTitle>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{messages.length}</div>
          <p className="text-xs text-muted-foreground mb-3">
            Total messages
          </p>
          {recentMessages.length > 0 && (
            <div className="space-y-2">
              {recentMessages.map((message) => (
                <div key={message.id} className="text-xs">
                  <p className="truncate text-muted-foreground">{message.text}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {formatRelativeTime(message.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
