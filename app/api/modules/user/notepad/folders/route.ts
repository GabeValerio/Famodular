import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupIdParam = searchParams.get('groupId');
    
    // Normalize groupId: treat empty string, null, or undefined as null
    const groupId = groupIdParam && groupIdParam.trim() !== '' ? groupIdParam : null;

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();
    
    // CRITICAL: For group view, verify user is a member of the group
    if (groupId) {
      const { data: groupMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (!groupMember) {
        return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
      }
    }
    
    // Build query
    // For group view: show ALL folders for the group (any user in the group can see them)
    // For self view: show ONLY the current user's personal folders
    let query = supabase
      .from('notepad_folders')
      .select('*');

    // CRITICAL: Filter by groupId FIRST to ensure proper data isolation
    if (groupId) {
      // Group view: Show ALL folders for this specific group (NO user_id filter)
      query = query.eq('group_id', groupId);
    } else {
      // Self view: Filter by user_id AND group_id IS NULL
      query = query.eq('user_id', session.user.id).is('group_id', null);
    }

    // Order by name
    query = query.order('name', { ascending: true });

    const { data: folders, error } = await query;

    // If table doesn't exist yet, return empty array (graceful degradation)
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST116' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation') ||
        error.message?.includes('Could not find a relationship')
      ) {
        return NextResponse.json([]);
      }
      throw error;
    }

    // Convert date strings to Date objects and map snake_case to camelCase
    const formattedFolders = (folders || []).map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      userId: folder.user_id,
      groupId: folder.group_id || undefined,
      createdAt: new Date(folder.created_at),
      updatedAt: new Date(folder.updated_at),
    }));

    return NextResponse.json(formattedFolders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const body = await request.json();
    const { name, groupId: groupIdParam } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Normalize groupId: treat empty string, null, or undefined as null
    const groupId = groupIdParam && groupIdParam.trim() !== '' ? groupIdParam : null;

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();
    
    // CRITICAL: For group view, verify user is a member of the group
    if (groupId) {
      const { data: groupMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (!groupMember) {
        return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
      }
    }

    // Create folder
    const { data: folder, error } = await supabase
      .from('notepad_folders')
      .insert({
        name: name.trim(),
        user_id: session.user.id,
        group_id: groupId || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Format response
    const formattedFolder = {
      id: folder.id,
      name: folder.name,
      userId: folder.user_id,
      groupId: folder.group_id || undefined,
      createdAt: new Date(folder.created_at),
      updatedAt: new Date(folder.updated_at),
    };

    return NextResponse.json(formattedFolder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

