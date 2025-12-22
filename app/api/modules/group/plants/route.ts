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
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Verify user has access to this group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
    }

    // Fetch plants for this group
    const { data: plants, error } = await supabase
      .from('plants')
      .select('*, plant_photos(image_url, photo_date)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .order('photo_date', { foreignTable: 'plant_photos', ascending: false });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Plants table does not exist. Please run the migration: docs/migrations/create_plants_tables.sql' },
          { status: 503 }
        );
      }
      throw error;
    }

    // Convert date strings to Date objects and map snake_case to camelCase
    const plantsWithDates = plants?.map(plant => {
      const latestPhoto = plant.plant_photos?.[0];

      return {
        id: plant.id,
        name: plant.name,
        commonName: plant.common_name,
        location: plant.location,
        recommendedWaterSchedule: plant.recommended_water_schedule,
        waterAmount: plant.water_amount,
        lastWatered: plant.last_watered ? new Date(plant.last_watered) : undefined,
        groupId: plant.group_id,
        userId: plant.user_id,
        latestPhotoUrl: latestPhoto?.image_url,
        createdAt: new Date(plant.created_at),
        updatedAt: new Date(plant.updated_at),
      };
    }) || [];

    return NextResponse.json(plantsWithDates);
  } catch (error) {
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

    const body = await request.json();
    const { name, commonName, location, recommendedWaterSchedule, waterAmount, lastWatered, groupId } = body;

    if (!name || !groupId) {
      return NextResponse.json(
        { error: 'Name and groupId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Verify user has access to group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const newPlant = {
      name,
      common_name: commonName || null,
      location: location || null,
      recommended_water_schedule: recommendedWaterSchedule || null,
      water_amount: waterAmount || null,
      last_watered: lastWatered ? new Date(lastWatered).toISOString() : null,
      group_id: groupId,
      user_id: session.user.id,
      created_at: now,
      updated_at: now,
    };

    const { data: plant, error } = await supabase
      .from('plants')
      .insert(newPlant)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Plants table does not exist. Please run the migration: docs/migrations/create_plants_tables.sql' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create plant' },
        { status: 400 }
      );
    }

    // Convert to camelCase
    const plantWithDates = {
      id: plant.id,
      name: plant.name,
      commonName: plant.common_name,
      location: plant.location,
      recommendedWaterSchedule: plant.recommended_water_schedule,
      waterAmount: plant.water_amount,
      lastWatered: plant.last_watered ? new Date(plant.last_watered) : undefined,
      groupId: plant.group_id,
      userId: plant.user_id,
      createdAt: new Date(plant.created_at),
      updatedAt: new Date(plant.updated_at),
    };

    return NextResponse.json(plantWithDates, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

