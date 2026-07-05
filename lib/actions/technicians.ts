"use server";

// Admin-only server actions for managing technicians.
// Uses the SERVICE-ROLE client because we need to:
//   * create auth.users rows via auth.admin.createUser (regular RLS can't do that)
//   * overwrite the profile row (default from the auto-trigger is 'requester')

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/guard";

async function assertAdmin() {
  await requireProfile(["admin"]); // redirects if not an admin
}

// ---------------------------------------------------------------------------
// Create a technician: auth user + profile row + trades.
// ---------------------------------------------------------------------------
export async function createTechnician(formData: FormData): Promise<{ error?: string; id?: string }> {
  await assertAdmin();
  const admin = createAdminClient();

  const full_name      = (formData.get("full_name") as string | null)?.trim();
  const email          = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password       = (formData.get("password") as string | null) ?? "";
  const phone          = (formData.get("phone") as string | null)?.trim() || null;
  const signature_path = (formData.get("signature_path") as string | null) || null;
  const avatar_url     = (formData.get("avatar_url") as string | null) || null;
  const tradeIds       = formData.getAll("trade_ids").filter(Boolean) as string[];

  if (!full_name)             return { error: "Name is required." };
  if (!email)                 return { error: "Email is required." };
  if (password.length < 8)    return { error: "Password must be at least 8 characters." };
  if (tradeIds.length === 0)  return { error: "Pick at least one trade." };

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

  // 2. Upsert profile — our on-auth trigger already inserted a 'requester' row;
  // we overwrite name/role/phone here.
  const { error: profErr } = await admin
    .from("profiles")
    .upsert({ id: userId, full_name, role: "technician", phone, signature_path, avatar_url, is_active: true }, { onConflict: "id" });
  if (profErr) return { error: `Auth ok but profile failed: ${profErr.message}` };

  // 3. Insert trades.
  const rows = tradeIds.map((c) => ({ technician_id: userId, category_id: c }));
  const { error: tradeErr } = await admin.from("technician_trades").insert(rows);
  if (tradeErr) return { error: `Profile ok but trades failed: ${tradeErr.message}` };

  revalidatePath("/admin/technicians");
  return { id: userId };
}

// ---------------------------------------------------------------------------
// Update a technician's display fields + trades. Does NOT change auth email/password.
// ---------------------------------------------------------------------------
export async function updateTechnician(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  await assertAdmin();
  const supabase = await createClient(); // RLS admin policy allows this

  const full_name      = (formData.get("full_name") as string | null)?.trim();
  const phone          = (formData.get("phone") as string | null)?.trim() || null;
  const signature_path = (formData.get("signature_path") as string | null) || null;
  const avatar_url     = (formData.get("avatar_url") as string | null) || null;
  const tradeIds       = formData.getAll("trade_ids").filter(Boolean) as string[];

  if (!full_name)            return { error: "Name is required." };
  if (tradeIds.length === 0) return { error: "Pick at least one trade." };

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ full_name, phone, signature_path, avatar_url })
    .eq("id", id);
  if (profErr) return { error: profErr.message };

  // Replace the trades list: delete then re-insert.
  const { error: delErr } = await supabase.from("technician_trades").delete().eq("technician_id", id);
  if (delErr) return { error: delErr.message };

  const rows = tradeIds.map((c) => ({ technician_id: id, category_id: c }));
  const { error: insErr } = await supabase.from("technician_trades").insert(rows);
  if (insErr) return { error: insErr.message };

  revalidatePath("/admin/technicians");
  revalidatePath(`/admin/technicians/${id}`);
  return {};
}

// ---------------------------------------------------------------------------
// Toggle active — deactivated techs can't be assigned new tickets.
// ---------------------------------------------------------------------------
export async function setTechnicianActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/technicians");
  return {};
}
