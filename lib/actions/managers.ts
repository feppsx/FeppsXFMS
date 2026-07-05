"use server";

// Admin-only server actions for managing "Manager" accounts.
// A Manager is a user with role='manager' who logs into the same technician
// portal for oversight. Uses the service-role client for the auth.admin
// createUser + profile upsert, exactly like technicians (minus trades).

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/guard";

async function assertAdmin() {
  await requireProfile(["admin"]);
}

// ---------------------------------------------------------------------------
// Create a manager: auth user + profile row (no trades).
// ---------------------------------------------------------------------------
export async function createManager(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  await assertAdmin();
  const admin = createAdminClient();

  const full_name  = (formData.get("full_name") as string | null)?.trim();
  const email      = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password   = (formData.get("password") as string | null) ?? "";
  const phone      = (formData.get("phone") as string | null)?.trim() || null;
  const avatar_url = (formData.get("avatar_url") as string | null) || null;

  if (!full_name)            return { error: "Name is required." };
  if (!email)                return { error: "Email is required." };
  if (password.length < 8)   return { error: "Password must be at least 8 characters." };

  // 1. Create the auth.users row (auto-confirmed so they can log in immediately).
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (authErr || !created?.user) {
    return { error: authErr?.message ?? "Could not create auth user." };
  }
  const userId = created.user.id;

  // 2. Upsert profile — the on-auth trigger already inserted a 'requester' row;
  //    we overwrite name/role/phone here.
  const { error: profErr } = await admin
    .from("profiles")
    .upsert(
      { id: userId, full_name, role: "manager", phone, avatar_url, is_active: true },
      { onConflict: "id" }
    );
  if (profErr) return { error: `Auth ok but profile failed: ${profErr.message}` };

  revalidatePath("/admin/managers");
  return { id: userId };
}

// ---------------------------------------------------------------------------
// Update a manager's display fields. Does NOT change auth email/password.
// ---------------------------------------------------------------------------
export async function updateManager(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  await assertAdmin();
  const supabase = await createClient();

  const full_name  = (formData.get("full_name") as string | null)?.trim();
  const phone      = (formData.get("phone") as string | null)?.trim() || null;
  const avatar_url = (formData.get("avatar_url") as string | null) || null;

  if (!full_name) return { error: "Name is required." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone, avatar_url })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/managers");
  revalidatePath(`/admin/managers/${id}`);
  return {};
}

// ---------------------------------------------------------------------------
// Toggle active — deactivated managers can't log in effectively.
// ---------------------------------------------------------------------------
export async function setManagerActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/managers");
  return {};
}
