import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    },
    global: {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }
})

// Server-side Supabase client (uses service role key, bypasses RLS)
// Use this in API routes where we've already verified authentication via NextAuth
export function getSupabaseServerClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
        // Fallback to anon key if service role key is not set (for development)
        console.warn('SUPABASE_SERVICE_ROLE_KEY not set, using anon key. RLS policies may block operations.');
        return supabase;
    }
    
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    });
}