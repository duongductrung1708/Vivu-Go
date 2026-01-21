import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
  );
}

// Default client:
// - detectSessionInUrl enabled (for OAuth callbacks)
// - email flows (reset/confirm) use custom URLs that don't expose access_token directly
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
