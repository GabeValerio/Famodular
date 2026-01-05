"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Github,
  BookOpen,
  Calendar,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  defaultView?: string;
  instagram?: string;
  x_twitter?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  github?: string;
  website?: string;
  currentlyReading?: Array<{
    id: string;
    userId: string;
    bookId: string;
    startedDate: string;
    createdAt?: string;
    book?: {
      id: string;
      title: string;
      authors?: string[];
      description?: string;
      imageLinks?: {
        smallThumbnail?: string;
        thumbnail?: string;
        small?: string;
        medium?: string;
        large?: string;
        extraLarge?: string;
      };
      publishedDate?: string;
      publisher?: string;
      pageCount?: number;
      categories?: string[];
      averageRating?: number;
      ratingsCount?: number;
    };
  }>;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const userData = await response.json();
          setProfile(userData);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">Unable to load profile</p>
          </div>
        </div>
      </div>
    );
  }

  const socialLinks = [
    { key: 'website', icon: Globe, label: 'Website', value: profile.website },
    { key: 'instagram', icon: Instagram, label: 'Instagram', value: profile.instagram, prefix: 'https://instagram.com/' },
    { key: 'x_twitter', icon: Twitter, label: 'X (Twitter)', value: profile.x_twitter, prefix: 'https://twitter.com/' },
    { key: 'facebook', icon: Facebook, label: 'Facebook', value: profile.facebook, prefix: 'https://facebook.com/' },
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', value: profile.linkedin, prefix: 'https://linkedin.com/in/' },
    { key: 'youtube', icon: Youtube, label: 'YouTube', value: profile.youtube, prefix: 'https://youtube.com/@' },
    { key: 'github', icon: Github, label: 'GitHub', value: profile.github, prefix: 'https://github.com/' },
  ].filter(link => link.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">View and manage your profile information</p>
        </div>
        <Link href="/dashboard/settings">
          <Button variant="outline">
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Profile Card */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback>
                    {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{profile.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Mail className="mr-1 h-4 w-4" />
                    {profile.email}
                  </CardDescription>
                  {profile.phone && (
                    <CardDescription className="flex items-center mt-1">
                      <Phone className="mr-1 h-4 w-4" />
                      {profile.phone}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Currently Reading Section */}
            {profile.currentlyReading && profile.currentlyReading.length > 0 && (
              <CardContent>
                <Separator className="mb-6" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Currently Reading ({profile.currentlyReading.length})
                  </h3>

                  <div className="space-y-3">
                    {profile.currentlyReading.map((userBook) => (
                      <div key={userBook.id} className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
                        {userBook.book?.imageLinks?.thumbnail && (
                          <div className="relative w-16 h-24 flex-shrink-0">
                            <Image
                              src={userBook.book.imageLinks.thumbnail}
                              alt={`Cover of ${userBook.book.title}`}
                              fill
                              className="object-cover rounded shadow-sm"
                              sizes="64px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-lg line-clamp-2">
                            {userBook.book?.title || 'Unknown Title'}
                          </h4>
                          {userBook.book?.authors && userBook.book.authors.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              by {userBook.book.authors.join(', ')}
                            </p>
                          )}
                          {userBook.startedDate && (
                            <div className="flex items-center mt-2 text-sm text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              Started {new Date(userBook.startedDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Social Links Sidebar */}
        <div className="space-y-6">
          {socialLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Social Links</CardTitle>
                <CardDescription>Connect with me online</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  const href = link.prefix ? `${link.prefix}${link.value}` : link.value;
                  return (
                    <a
                      key={link.key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors group"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      <span className="text-sm">{link.label}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground ml-auto" />
                    </a>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Member since</span>
                <span className="text-sm font-medium">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              {profile.currentlyReadingTitle && profile.currentlyReading && profile.currentlyReading.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Books reading</span>
                  <Badge variant="secondary">{profile.currentlyReading.length}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
