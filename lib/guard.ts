// Role guard for server components. Call at the top of any protected page.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/db-types";

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

  if (!profile) redirect("/login?error=no-profile");

  if (!allowed.includes(profile.role)) {
    // Signed in but wrong role -> send them home.
    redirect("/");
  }

  return profile;
}
