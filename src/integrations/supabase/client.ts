import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
  );
}

// IMPORTANT:
// - detectSessionInUrl MUST be false to avoid auto-login on email links
//   (reset password / confirm signup) before the user completes the intended flow.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
  },
});
