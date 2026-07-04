// SERVER-ONLY Supabase client that uses the service_role key.
// It bypasses Row-Level Security and can call auth.admin.* APIs.
// NEVER import this into a "use client" component or a browser bundle —
// leaking the service_role key is game-over for the whole database.
//
// The service_role key has no NEXT_PUBLIC_ prefix, so if a client bundle
// somehow imports this file the constructor throws at runtime.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// We haven't generated Database types yet, so we pass `any` schema generics.
// This lets us call .insert / .upsert / .update with plain objects without
// TypeScript complaining that the row shape is `never`.
type AnyDb = { public: { Tables: Record<string, any>; Views: Record<string, any>; Functions: Record<string, any> } };

let cached: SupabaseClient<AnyDb> | null = null;

export function createAdminClient(): SupabaseClient<AnyDb> {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set"
    );
  }

  cached = createClient<AnyDb>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
