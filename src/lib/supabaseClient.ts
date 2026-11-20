import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://piyzjodvmejqxvpwzohp.supabase.co';
const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xdLE-ZqhvnYuXOuTRZ5nLQ_ThPaGghw';

export const isSupabaseClientConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseClientConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
