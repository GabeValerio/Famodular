import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json({ error: 'Folder name must be a non-empty string' }, { status: 400 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // First, verify the folder exists and user has access
    const { data: existingFolder, error: fetchError } = await supabase
      .from('notepad_folders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Verify user has access (owner or group member)
    if (existingFolder.user_id !== session.user.id) {
      // Check if it's a group folder and user is a member
      if (existingFolder.group_id) {
        const { data: groupMember } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', existingFolder.group_id)
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();

        if (!groupMember) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Build update object
    const updates: any = {};
    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update folder
    const { data: folder, error } = await supabase
      .from('notepad_folders')
      .update(updates)
      .eq('id', params.id)
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

    return NextResponse.json(formattedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // First, verify the folder exists and user has access
    const { data: existingFolder, error: fetchError } = await supabase
      .from('notepad_folders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Verify user has access (owner or group member)
    if (existingFolder.user_id !== session.user.id) {
      // Check if it's a group folder and user is a member
      if (existingFolder.group_id) {
        const { data: groupMember } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', existingFolder.group_id)
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();

        if (!groupMember) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Delete folder (notes will have folder_id set to NULL due to ON DELETE SET NULL)
    const { error } = await supabase
      .from('notepad_folders')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}





