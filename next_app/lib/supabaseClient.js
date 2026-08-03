import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxb25oaHFvc3lzem5jamZveGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzAwMDAsImV4cCI6MjA2OTcwMDAwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
