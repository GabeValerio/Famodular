import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';

// GET - Validate an invitation token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const supabase = getSupabaseServerClient();

    // Look up invitation by short_code first, then try invite_token
    let invitation: any = null;
    let invitationError: any = null;

    // Try short_code first
    let result = await supabase
      .from('group_invitations')
      .select(`
        *,
        groups (
          id,
          name,
          description
        )
      `)
      .eq('short_code', token)
      .single();

    if (result.data) {
      invitation = result.data;
    } else {
      // If not found by short_code, try invite_token
      result = await supabase
        .from('group_invitations')
        .select(`
          *,
          groups (
            id,
            name,
            description
          )
        `)
        .eq('invite_token', token)
        .single();
      
      invitation = result.data;
      invitationError = result.error;
    }

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check expiration
    const expiresAt = new Date(invitation.expires_at);
    if (new Date() > expiresAt) {
      // Mark as expired
      await supabase
        .from('group_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        full_name: invitation.full_name,
        group_name: invitation.group_name || (invitation.groups as any)?.name,
        expires_at: invitation.expires_at,
        status: invitation.status,
      },
    });

  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
