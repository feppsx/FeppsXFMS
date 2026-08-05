// Role + org guards for server components. Call at the top of any protected
// page. Post-v3: every tenant page is scoped to the caller's organization.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, PlatformAdmin, UserRole } from "@/lib/db-types";

/**
 * Require a signed-in user with a matching role in the profiles table.
 * Returns the profile (including organization_id) for downstream queries.
 */
export async function requireProfile(allowed: UserRole[]): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  // No profile row: could be a platform admin (they don't have a profile),
  // send them to /platform. Otherwise something is wrong.
  if (!profile) {
    const { data: pa } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (pa) redirect("/platform");
    redirect("/login?error=no-profile");
  }

  if (!allowed.includes(profile.role)) {
    redirect("/");
  }

  // Suspended-org gate: if the org is suspended or deactivated, sign the user
  // out and bounce them to /login with a message. Platform admins bypass this
  // (they're in platform_admins, not profiles, so they never get here).
  const { data: org } = await supabase
    .from("organizations")
    .select("is_active, is_suspended, name")
    .eq("id", profile.organization_id)
    .maybeSingle<{ is_active: boolean; is_suspended: boolean; name: string }>();

  if (org && (org.is_suspended || !org.is_active)) {
    await supabase.auth.signOut();
    redirect("/login?org_suspended=1");
  }

  // Deactivated individual user — same treatment.
  if (!profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?deactivated=1");
  }

  return profile;
}

/**
 * Require a signed-in FeppsXFMS platform admin. Returns the platform_admin row.
 * Redirects tenants to their own home.
 */
export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pa } = await supabase
    .from("platform_admins")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<PlatformAdmin>();

  if (!pa || !pa.is_active) redirect("/");
  return pa;
}

/**
 * Read the caller's organization_id (from their profile), or null for platform
 * admins / signed-out users. Use inside server actions and data fetchers to
 * scope inserts + queries.
 */
export async function currentOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle<{ organization_id: string }>();

  return data?.organization_id ?? null;
}
