import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client for direct database queries (optional)
// Note: Most queries go through the backend API for security
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// API Base URL (Backend API)
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
