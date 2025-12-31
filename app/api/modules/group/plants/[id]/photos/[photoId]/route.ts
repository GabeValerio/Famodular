import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Fetch photo to verify access through plant
    const { data: photo, error: photoError } = await supabase
      .from('plant_photos')
      .select('plant_id')
      .eq('id', params.photoId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Fetch plant to verify access
    const { data: plant, error: plantError } = await supabase
      .from('plants')
      .select('*')
      .eq('id', photo.plant_id)
      .single();

    if (plantError || !plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    // Verify user has access to this group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', plant.group_id)
      .eq('user_id', session.user.id)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('plant_photos')
      .delete()
      .eq('id', params.photoId);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete photo' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}





