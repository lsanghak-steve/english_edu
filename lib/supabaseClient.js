import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
