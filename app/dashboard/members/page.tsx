"use client";

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Plus, Mail, Crown, User } from 'lucide-react';

// Mock data - this will be replaced with real data from Supabase later
const mockMembers = [
  {
    id: '1',
    name: 'Dad',
    role: 'Parent',
    avatar: 'https://picsum.photos/seed/dad/200/200',
    email: 'dad@valerio.com',
    status: 'active',
    joinDate: '2024-01-15'
  },
  {
    id: '2',
    name: 'Mom',
    role: 'Parent',
    avatar: 'https://picsum.photos/seed/mom/200/200',
    email: 'mom@valerio.com',
    status: 'active',
    joinDate: '2024-01-15'
  },
  {
    id: '3',
    name: 'Leo',
    role: 'Child',
    avatar: 'https://picsum.photos/seed/kid1/200/200',
    email: 'leo@valerio.com',
    status: 'active',
    joinDate: '2024-02-01'
  },
  {
    id: '4',
    name: 'Mia',
    role: 'Child',
    avatar: 'https://picsum.photos/seed/kid2/200/200',
    email: 'mia@valerio.com',
    status: 'active',
    joinDate: '2024-02-01'
  },
];

export default function MembersPage() {
  const [members] = useState(mockMembers);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Parent':
        return <Crown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Parent':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Group Members</h1>
          <p className="text-muted-foreground">Manage members of The Valerio's family group</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                />

                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <Badge variant="outline" className={getRoleColor(member.role)}>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(member.role)}
                        <span>{member.role}</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{member.email}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(member.joinDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Group Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Group Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{members.length}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {members.filter(m => m.role === 'Parent').length}
              </div>
              <div className="text-sm text-muted-foreground">Parents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {members.filter(m => m.role === 'Child').length}
              </div>
              <div className="text-sm text-muted-foreground">Children</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
