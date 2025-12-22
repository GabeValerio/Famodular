import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// GET: Fetch current user's profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, avatar, phone, default_view, enabled_modules')
      .eq('id', session.user.id)
      .single();

    if (error) {
      throw error;
    }

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      default_view: user.default_view,
      enabled_modules: user.enabled_modules,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, defaultView, avatar, phone } = body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (defaultView !== undefined) updates.default_view = defaultView;
    if (avatar !== undefined) {
      // Validate avatar URL if provided
      if (avatar && typeof avatar === 'string' && avatar.trim()) {
        updates.avatar = avatar.trim();
      } else {
        updates.avatar = null;
      }
    }
    if (phone !== undefined) {
      // Validate phone number if provided
      if (phone && typeof phone === 'string' && phone.trim()) {
        updates.phone = phone.trim();
      } else {
        updates.phone = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}