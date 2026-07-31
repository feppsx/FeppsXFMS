import { AppShell } from "@/components/AppShell";
import { TeamPageClient } from "@/components/TeamPageClient";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const profile = await requireProfile(["org_admin"]);
  const supabase = await createClient();

  // RLS filters by organization_id automatically for org_admin.
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("role")
    .order("full_name");

  const members = ((data ?? []) as unknown) as Profile[];

  return (
    <AppShell profile={profile}>
      <TeamPageClient members={members} currentUserId={profile.id} />
    </AppShell>
  );
}
