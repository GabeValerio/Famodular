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

    // Fetch plant
    const { data: plant, error } = await supabase
      .from('plants')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !plant) {
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

    // Convert to camelCase
    const plantWithDates = {
      id: plant.id,
      name: plant.name,
      commonName: plant.common_name,
      location: plant.location,
      recommendedWaterSchedule: plant.recommended_water_schedule,
      lastWatered: plant.last_watered ? new Date(plant.last_watered) : undefined,
      groupId: plant.group_id,
      userId: plant.user_id,
      createdAt: new Date(plant.created_at),
      updatedAt: new Date(plant.updated_at),
    };

    return NextResponse.json(plantWithDates);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, commonName, location, recommendedWaterSchedule, lastWatered } = body;

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

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (commonName !== undefined) updates.common_name = commonName;
    if (location !== undefined) updates.location = location;
    if (recommendedWaterSchedule !== undefined) updates.recommended_water_schedule = recommendedWaterSchedule;
    if (lastWatered !== undefined) {
      updates.last_watered = lastWatered ? new Date(lastWatered).toISOString() : null;
    }
    updates.updated_at = new Date().toISOString();

    const { data: updatedPlant, error } = await supabase
      .from('plants')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update plant' },
        { status: 400 }
      );
    }

    // Convert to camelCase
    const plantWithDates = {
      id: updatedPlant.id,
      name: updatedPlant.name,
      commonName: updatedPlant.common_name,
      location: updatedPlant.location,
      recommendedWaterSchedule: updatedPlant.recommended_water_schedule,
      lastWatered: updatedPlant.last_watered ? new Date(updatedPlant.last_watered) : undefined,
      groupId: updatedPlant.group_id,
      userId: updatedPlant.user_id,
      createdAt: new Date(updatedPlant.created_at),
      updatedAt: new Date(updatedPlant.updated_at),
    };

    return NextResponse.json(plantWithDates);
  } catch (error) {
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

    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete plant' },
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




