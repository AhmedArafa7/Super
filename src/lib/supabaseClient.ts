
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview المحرك العصبي للتخزين الخارجي.
 * نستخدم Supabase كبديل مجاني لـ Firebase Storage لتجنب قيود المناطق الجغرافية.
 */

// ملاحظة: هذه القيم تجريبية، يجب على المستخدم استبدالها بقيمه الخاصة من لوحة تحكم Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
