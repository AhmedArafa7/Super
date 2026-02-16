
import { createClient } from '@supabase/supabase-js';

// دعم NextJS و Vite معاً لأقصى درجات التوافق
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder'))) {
  console.warn('⚠️ Nexus Sync: Supabase credentials missing or invalid. Storage functionality will use simulated neural links.');
}

// تهيئة العميل مع معالجة الأخطاء لضمان استقرار البناء والتشغيل
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
        console.error('🌐 Network Error: Failed to reach Nexus Storage node.', err);
        throw err;
      })
    }
  }
);
