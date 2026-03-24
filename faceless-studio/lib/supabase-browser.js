'use client';
import { createClient } from '@supabase/supabase-js';

// Singleton browser client — safe to import in any client component
let client = null;

export function getSupabaseBrowser() {
  if (client) return client;
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );
  return client;
}