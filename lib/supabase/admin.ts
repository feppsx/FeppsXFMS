// SERVER-ONLY Supabase client that uses the service_role key.
// It bypasses Row-Level Security and can call auth.admin.* APIs.
// NEVER import this into a "use client" component or a browser bundle —
// leaking the service_role key is game-over for the whole database.

// The service_role key is only available server-side (no NEXT_PUBLIC_ prefix),
// so if a client bundle somehow imports this file, the constructor will throw
// at runtime because the env var is absent.
import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (cached) return cached;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set in .env.local"
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
