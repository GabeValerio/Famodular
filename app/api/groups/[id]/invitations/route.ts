import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { generateInviteToken, generateShortCode, generateRegistrationLink } from '@/lib/invitation-utils';

// GET - List all invitations for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const supabase = getSupabaseServerClient();

    // Verify user is an Admin member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership || membership.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only group admins can view invitations' },
        { status: 403 }
      );
    }

    // Fetch all invitations for this group
    const { data: invitations, error: invitationsError } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Error listing group invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new group invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const body = await request.json();
    const { email, full_name } = body;

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full_name are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Verify user is an Admin member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership || membership.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only group admins can create invitations' },
        { status: 403 }
      );
    }

    // Get group name for the invitation
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check for duplicate pending invitations
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('email', email)
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvite && !existingInviteError) {
      return NextResponse.json(
        { error: 'An invitation for this email already exists' },
        { status: 400 }
      );
    }

    // Check if email already is a member of this group
    // First check if a user with this email exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser && !userError) {
      // Check if this user is already a member of the group
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', existingUser.id)
        .eq('is_active', true)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'This email is already a member of this group' },
          { status: 400 }
        );
      }
    }

    // Generate tokens
    const inviteToken = generateInviteToken();
    const shortCode = await generateShortCode();
    
    // Set expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('group_invitations')
      .insert({
        group_id: groupId,
        invited_by_user_id: session.user.id,
        email,
        full_name,
        invite_token: inviteToken,
        short_code: shortCode,
        expires_at: expiresAt.toISOString(),
        group_name: group.name,
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Generate registration link
    const registrationLink = generateRegistrationLink(shortCode);

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        full_name: invitation.full_name,
        expires_at: invitation.expires_at,
        status: invitation.status,
      },
      registration_link: registrationLink,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating group invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

