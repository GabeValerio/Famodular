"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Crown, User, Users, BookOpen } from 'lucide-react';
import { DashboardWidgetProps } from '../types/dashboard';
import { BookModal } from './BookModal';

interface CurrentlyReadingBook {
  id: string;
  bookId: string;
  startedDate: string;
  book: {
    id: string;
    title: string;
    authors: string[];
    coverUrl?: string;
  } | null;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  joinDate: string;
  currentlyReading: CurrentlyReadingBook[];
}

export function GroupMembersWidget({ groupId }: DashboardWidgetProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<{
    book: CurrentlyReadingBook['book'];
    memberName: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!groupId) {
        setError('No group selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/groups/${groupId}/members`);
        if (!response.ok) {
          throw new Error('Failed to fetch group members');
        }
        const data = await response.json();
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const handleBookClick = (book: CurrentlyReadingBook['book'], memberName: string) => {
    setSelectedBook({ book, memberName });
    setIsModalOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Crown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Group Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading members...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Group Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeMembers = members.filter(m => m.status === 'active');
  const parentCount = activeMembers.filter(m => m.role === 'Admin').length;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Group Members</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{activeMembers.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{parentCount}</div>
            <div className="text-xs text-muted-foreground">Admins</div>
          </div>
        </div>

        {/* Group members with their books */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Group Members</h4>
          {activeMembers.slice(0, 4).map((member) => (
            <div key={member.id} className="space-y-2">
              {/* Member info */}
              <div className="flex items-center space-x-3">
                <img
                  src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                  alt={member.name}
                  className="h-8 w-8 rounded-full object-cover border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(member.role)}
                        <span>{member.role}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Currently reading books below */}
              {member.currentlyReading.length > 0 ? (
                <div className="ml-11 flex flex-wrap gap-2">
                  {member.currentlyReading.map((reading) => (
                    <div
                      key={reading.id}
                      className="group relative cursor-pointer"
                      onClick={() => handleBookClick(reading.book, member.name)}
                    >
                      {reading.book?.coverUrl ? (
                        <img
                          src={reading.book.coverUrl}
                          alt={reading.book.title}
                          className="h-12 w-8 rounded object-cover shadow-sm border border-gray-200 group-hover:shadow-md transition-all duration-200 hover:scale-105"
                          title={`Click to view: ${reading.book.title}`}
                        />
                      ) : (
                        <div className="h-12 w-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-11">
                  <p className="text-xs text-muted-foreground italic">Not currently reading</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {activeMembers.length > 4 && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              +{activeMembers.length - 4} more members
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Book Details Modal */}
    <BookModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      book={selectedBook?.book || null}
      memberName={selectedBook?.memberName || ''}
    />
  </>
  );
}
