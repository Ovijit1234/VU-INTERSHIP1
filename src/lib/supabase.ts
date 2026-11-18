import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID = 'vvqjdyxvuvoloxrlgyqt';
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_hCSxyrYAz927LY2ccPmu4A_OaXahgun';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
