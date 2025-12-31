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
    const { title, content, folderId } = body;

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return NextResponse.json({ error: 'Note title must be a non-empty string' }, { status: 400 });
    }

    if (content !== undefined && typeof content !== 'string') {
      return NextResponse.json({ error: 'Note content must be a string' }, { status: 400 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // First, verify the note exists and user has access
    const { data: existingNote, error: fetchError } = await supabase
      .from('notepad_notes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify user has access (owner or group member)
    if (existingNote.user_id !== session.user.id) {
      // Check if it's a group note and user is a member
      if (existingNote.group_id) {
        const { data: groupMember } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', existingNote.group_id)
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

    // If folderId is being changed, verify the new folder exists and belongs to the same context
    if (folderId !== undefined && folderId !== existingNote.folder_id) {
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
        if (folder.group_id !== existingNote.group_id) {
          return NextResponse.json({ error: 'Folder does not belong to the same context' }, { status: 400 });
        }
      }
    }

    // Build update object
    const updates: any = {};
    if (title !== undefined) {
      updates.title = title.trim();
    }
    if (content !== undefined) {
      updates.content = content;
    }
    if (folderId !== undefined) {
      updates.folder_id = folderId || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update note
    const { data: note, error } = await supabase
      .from('notepad_notes')
      .update(updates)
      .eq('id', params.id)
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

    return NextResponse.json(formattedNote);
  } catch (error) {
    console.error('Error updating note:', error);
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

    // First, verify the note exists and user has access
    const { data: existingNote, error: fetchError } = await supabase
      .from('notepad_notes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify user has access (owner or group member)
    if (existingNote.user_id !== session.user.id) {
      // Check if it's a group note and user is a member
      if (existingNote.group_id) {
        const { data: groupMember } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', existingNote.group_id)
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

    // Delete note
    const { error } = await supabase
      .from('notepad_notes')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}



