import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create single optimized Supabase client with maximum performance
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'scholardorm-web',
      'Cache-Control': 'max-age=300' // Cache for 5 minutes
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 50
    }
  },
  db: {
    schema: 'public'
  }
});

// Helper function to create fast query options
export const getFastQueryOptions = () => ({
  count: 'estimated' as const,
  head: true
});

// Helper function to get headers for fast queries
export const getFastHeaders = () => ({
  'Prefer': 'count=estimated'
});