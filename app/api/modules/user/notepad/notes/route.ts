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
    const folderId = searchParams.get('folderId');
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
    // For group view: show ALL notes for the group (any user in the group can see them)
    // For self view: show ONLY the current user's personal notes
    let query = supabase
      .from('notepad_notes')
      .select('*');

    // CRITICAL: Filter by groupId FIRST to ensure proper data isolation
    if (groupId) {
      // Group view: Show ALL notes for this specific group (NO user_id filter)
      query = query.eq('group_id', groupId);
    } else {
      // Self view: Filter by user_id AND group_id IS NULL
      query = query.eq('user_id', session.user.id).is('group_id', null);
    }

    // Filter by folder if provided
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    // Order by updated_at descending (most recently updated first)
    query = query.order('updated_at', { ascending: false });

    const { data: notes, error } = await query;

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
    const formattedNotes = (notes || []).map((note: any) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      folderId: note.folder_id || undefined,
      userId: note.user_id,
      groupId: note.group_id || undefined,
      createdAt: new Date(note.created_at),
      updatedAt: new Date(note.updated_at),
    }));

    return NextResponse.json(formattedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
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
    const { title, content, folderId, groupId: groupIdParam } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Note title is required' }, { status: 400 });
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

    // If folderId is provided, verify it exists and belongs to the same context
    if (folderId) {
      const { data: folder, error: folderError } = await supabase
        .from('notepad_folders')
        .select('*')
        .eq('id', folderId)
        .single();

      if (folderError || !folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }

      // Verify folder belongs to same context (both personal or both same group)
      if (folder.group_id !== groupId) {
        return NextResponse.json({ error: 'Folder does not belong to the same context' }, { status: 400 });
      }
    }

    // Create note
    const { data: note, error } = await supabase
      .from('notepad_notes')
      .insert({
        title: title.trim(),
        content: content || '',
        folder_id: folderId || null,
        user_id: session.user.id,
        group_id: groupId || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Format response
    const formattedNote = {
      id: note.id,
      title: note.title,
      content: note.content,
      folderId: note.folder_id || undefined,
      userId: note.user_id,
      groupId: note.group_id || undefined,
      createdAt: new Date(note.created_at),
      updatedAt: new Date(note.updated_at),
    };

    return NextResponse.json(formattedNote, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}





