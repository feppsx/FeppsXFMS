"use server";

// Actions the tenant user calls to approve or deny an incoming
// impersonation request. RLS restricts UPDATE to rows where
// target_user_id = auth.uid(), so a user can only decide their own.

import { createClient } from "@/lib/supabase/server";

export async function respondToImpersonation(
  requestId: string,
  approve: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("impersonation_requests")
    .update({
      status: approve ? "approved" : "denied",
      decided_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("target_user_id", user.id)
    .eq("status", "pending");

  if (error) return { error: error.message };
  return {};
}
