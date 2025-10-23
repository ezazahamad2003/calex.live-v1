import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a dummy client if credentials are missing (for development without auth)
let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    '⚠️  Supabase credentials not configured. Client authentication is disabled.\n' +
    'To enable, add to frontend/.env.local:\n' +
    '  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n'
  );
}

export const supabase = supabaseClient as SupabaseClient;

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!supabaseClient;
}

/**
 * Get the current session token for API requests
 */
export async function getSessionToken(): Promise<string | null> {
  if (!supabaseClient) return null;
  
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting session token:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  if (!supabaseClient) return false;
  
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  if (!supabaseClient) return null;
  
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

