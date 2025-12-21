"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ShoppingCart, User, Calendar, CheckSquare, Target, MessageSquare, DollarSign, MapPin, Leaf, Heart } from 'lucide-react';
import CartDrawer from '@/app/components/CartDrawer';
import { useCart } from '@/lib/CartContext';
import { Footer } from '@/app/Footer';

export default function HomePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const { itemCount } = useCart();
  const { data: session } = useSession();

  // Fetch user avatar from database when logged in
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/users/me');
          if (response.ok) {
            const user = await response.json();
            setUserAvatar(user.avatar || null);
          }
        } catch (error) {
          console.error('Error fetching user avatar:', error);
        }
      } else {
        setUserAvatar(null);
      }
    };

    fetchUserAvatar();
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-gray-900">Famodular</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
              {session?.user ? (
                <Link href="/dashboard">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={session.user.name || "User"}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <span>Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Your Community Center, Your Way
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Famodular is a modular community center platform for groups of any kind. Customize your experience with the modules you need—calendars, todos, check-ins, goals, finance, and more.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8 space-y-3 sm:space-y-0 sm:space-x-3">
            {session?.user ? (
              <div className="rounded-md shadow">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-md shadow">
                  <Link href="/register">
                    <Button size="lg" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
                <div className="rounded-md shadow">
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <CardTitle>Calendar</CardTitle>
                </div>
                <CardDescription>
                  Keep track of group events, appointments, and important dates in one shared calendar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Shared group calendar</li>
                  <li>• Personal and group events</li>
                  <li>• Easy scheduling</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <CheckSquare className="h-5 w-5 text-gray-600" />
                  <CardTitle>Todos</CardTitle>
                </div>
                <CardDescription>
                  Organize tasks for yourself and your group with personal and shared todo lists.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Personal and group todos</li>
                  <li>• Task assignment</li>
                  <li>• Progress tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <CardTitle>Check-ins</CardTitle>
                </div>
                <CardDescription>
                  Stay connected with group check-ins to share how everyone is feeling.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Daily mood tracking</li>
                  <li>• Group communication</li>
                  <li>• Emotional wellness</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-gray-600" />
                  <CardTitle>Goals</CardTitle>
                </div>
                <CardDescription>
                  Set and track personal and group goals together with shared ambition tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Personal and group goals</li>
                  <li>• Progress monitoring</li>
                  <li>• Long-term planning</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <CardTitle>Finance</CardTitle>
                </div>
                <CardDescription>
                  Manage group finances, expenses, and budgets in one organized place.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Expense tracking</li>
                  <li>• Budget management</li>
                  <li>• Financial planning</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Leaf className="h-5 w-5 text-gray-600" />
                  <CardTitle>Plants</CardTitle>
                </div>
                <CardDescription>
                  Track and care for your plants with watering schedules and care reminders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Plant care tracking</li>
                  <li>• Watering schedules</li>
                  <li>• Care reminders</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}