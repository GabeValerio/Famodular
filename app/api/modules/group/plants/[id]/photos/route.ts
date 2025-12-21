import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Fetch plant to verify access
    const { data: plant, error: fetchError } = await supabase
      .from('plants')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !plant) {
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

    // Fetch photos for this plant
    const { data: photos, error } = await supabase
      .from('plant_photos')
      .select('*')
      .eq('plant_id', params.id)
      .order('photo_date', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Plant photos table does not exist. Please run the migration: docs/migrations/create_plants_tables.sql' },
          { status: 503 }
        );
      }
      throw error;
    }

    // Convert to camelCase
    const photosWithDates = photos?.map(photo => ({
      id: photo.id,
      plantId: photo.plant_id,
      imageUrl: photo.image_url,
      photoDate: new Date(photo.photo_date),
      createdAt: new Date(photo.created_at),
    })) || [];

    return NextResponse.json(photosWithDates);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, photoDate } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Fetch plant to verify access
    const { data: plant, error: fetchError } = await supabase
      .from('plants')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !plant) {
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

    const newPhoto = {
      plant_id: params.id,
      image_url: imageUrl,
      photo_date: photoDate ? new Date(photoDate).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { data: photo, error } = await supabase
      .from('plant_photos')
      .insert(newPhoto)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Plant photos table does not exist. Please run the migration: docs/migrations/create_plants_tables.sql' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create plant photo' },
        { status: 400 }
      );
    }

    // Convert to camelCase
    const photoWithDates = {
      id: photo.id,
      plantId: photo.plant_id,
      imageUrl: photo.image_url,
      photoDate: new Date(photo.photo_date),
      createdAt: new Date(photo.created_at),
    };

    return NextResponse.json(photoWithDates, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

