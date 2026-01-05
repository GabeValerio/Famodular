import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { ModuleConfig } from '@/types/family';

// GET: Fetch current user's enabled modules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('enabled_modules')
      .eq('id', session.user.id)
      .single();

    if (error) {
      // If column doesn't exist yet, return default modules
      if (error.code === '42703') {
        return NextResponse.json({
          enabledModules: {
            checkins: false,
            finance: false,
            goals: false,
            chat: false,
            wishlist: false,
            location: false,
            calendar: true,
            todos: true,
            plants: false,
            taskplanner: true,
            kitchen: false,
          } as ModuleConfig,
        });
      }
      throw error;
    }

    // Return user's module configuration or defaults
    // Default: Calendar, To Do, and Task Planner enabled for new users
    const enabledModules = (user.enabled_modules as ModuleConfig) || {
      checkins: false,
      finance: false,
      goals: false,
      chat: false,
      wishlist: false,
      location: false,
      calendar: true,
      todos: true,
      plants: false,
      taskplanner: true,
      kitchen: false,
    };

    return NextResponse.json({ enabledModules });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update current user's enabled modules
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabledModules } = await request.json();

    if (!enabledModules || typeof enabledModules !== 'object') {
      return NextResponse.json(
        { error: 'enabledModules must be an object' },
        { status: 400 }
      );
    }

    // Update user's module configuration
    const { data, error } = await supabase
      .from('users')
      .update({ enabled_modules: enabledModules })
      .eq('id', session.user.id)
      .select('enabled_modules')
      .single();

    if (error) {
      // If column doesn't exist, we'll need to add it via migration
      if (error.code === '42703') {
        return NextResponse.json(
          { error: 'Database column not found. Please run migration first.' },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ enabledModules: data.enabled_modules });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}


