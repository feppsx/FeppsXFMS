// Root of the app. Sends the signed-in user to the right home for their role.
// If they're signed in but have no profile row, we show an inline "no profile"
// notice (with a sign-out button) instead of bouncing — the middleware would
// otherwise send us back into a loop.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/utils";
import { NoProfileNotice } from "@/components/NoProfileNotice";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return <NoProfileNotice email={user.email ?? ""} userId={user.id} />;
  }

  redirect(homeForRole(profile.role));
}
