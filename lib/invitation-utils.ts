import crypto from 'crypto';
import { getSupabaseServerClient } from './supabaseClient';

/**
 * Generate a secure 64-character hex token (for backward compatibility)
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate unique 8-character short code
 * Excludes confusing characters (0, O, I, 1) for better user experience
 */
export async function generateShortCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, I, 1
  const supabase = getSupabaseServerClient();
  let code: string = '';
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const { data, error } = await supabase
      .from('group_invitations')
      .select('id')
      .eq('short_code', code)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No rows returned means code is unique
      isUnique = true;
    } else if (!data) {
      isUnique = true;
    }
    // If data exists, continue loop to generate new code
  }
  
  return code;
}

/**
 * Generate registration link with short code
 */
export function generateRegistrationLink(shortCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3008';
  return `${baseUrl}/register?invite=${shortCode}`;
}


