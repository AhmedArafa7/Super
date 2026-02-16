
import { createClient } from '@supabase/supabase-js';

// Support both NextJS and Vite prefix conventions for maximum compatibility
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder'))) {
  console.warn('⚠️ Nexus Sync: Supabase credentials missing or invalid. Check your .env file or Vercel Environment Variables.');
}

// During build time, if environment variables are missing, we use placeholder values to prevent the process from crashing.
// The actual values will be used when the app is running in a live environment.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (...args) => fetch(...args).catch(err => {
        console.error('🌐 Network Error: Failed to reach Supabase node. Check your internet or API keys.', err);
        throw err;
      })
    }
  }
);
