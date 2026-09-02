import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env';

// Supabase Client with Service Role Key (for backend operations)
// WARNING: Service Role Key bypasses RLS - use carefully!
let supabaseAdmin: SupabaseClient;

// Supabase Client with Anon Key (for public operations)
let supabasePublic: SupabaseClient;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdmin;
}

export function getSupabasePublic(): SupabaseClient {
  if (!supabasePublic) {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }
    supabasePublic = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }
  return supabasePublic;
}

// Create Supabase client with user's JWT token (for RLS)
export function getSupabaseWithToken(accessToken: string): SupabaseClient {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
  }
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
