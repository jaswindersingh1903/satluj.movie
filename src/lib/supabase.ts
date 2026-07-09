import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Both values are safe to commit — they get inlined into the browser JS
// bundle at build time either way. Security is enforced by Supabase RLS,
// not by hiding these strings. To point at a different project locally,
// override with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
// in .env.local.
const DEFAULT_URL = "https://zbafbeounwtfmrqwotby.supabase.co";
const DEFAULT_ANON_KEY =
  "sb_publishable_htx0Daw48AC11kTcO4ODDg_kJGRl5y_";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return client;
}
