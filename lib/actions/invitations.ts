"use server";

// Server actions for inviting team members INTO an org.
// Called by an org_admin. Creates the auth user + profile in one shot with a
// generated temp password, and logs an entry in the `invitations` table so
// the admin can see who they invited and when.
//
// v1 doesn't send an email — the temp password is returned to the org_admin
// to share with the invitee via whatever channel they prefer. Real email
// delivery can be added later without changing this shape.

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/db-types";

const ALLOWED_ROLES: UserRole[] = ["org_admin", "manager", "technician", "requester"];

function randomToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function randomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 11; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "!";
}

// ---------------------------------------------------------------------------
// Invite a team member into the caller's org.
// ---------------------------------------------------------------------------
export async function inviteTeamMember(formData: FormData): Promise<{
  error?: string;
  email?: string;
  tempPassword?: string;
}> {
  const profile = await requireProfile(["org_admin"]);
  const admin = createAdminClient();

  const email    = ((formData.get("email") as string | null) || "").trim().toLowerCase();
  const fullName = ((formData.get("full_name") as string | null) || "").trim();
  const role     = ((formData.get("role") as string | null) || "").trim() as UserRole;

  if (!email.includes("@")) return { error: "Please enter a valid email." };
  if (fullName.length < 2)  return { error: "Please enter the person's full name." };
  if (!ALLOWED_ROLES.includes(role)) return { error: "Pick a valid role." };

  const password = randomPassword();

  // 1. Create auth user with metadata so the handle_new_auth_user trigger
  //    creates the profile in the right org with the right role.
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      organization_id: profile.organization_id,
      role,
      full_name: fullName,
    },
  });
  if (userErr || !created?.user) {
    return { error: `Invite failed: ${userErr?.message ?? "unknown"}` };
  }

  // 2. Log the invitation (audit trail).
  await admin.from("invitations").insert({
    token: randomToken(),
    email,
    organization_id: profile.organization_id,
    role,
    invited_by: profile.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    used_at: new Date().toISOString(),  // temp-password flow = immediately usable
  });

  revalidatePath("/admin/team");
  return { email, tempPassword: password };
}

// ---------------------------------------------------------------------------
// Deactivate / reactivate a team member.
// ---------------------------------------------------------------------------
export async function setTeamMemberActive(
  userId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const profile = await requireProfile(["org_admin"]);
  const admin = createAdminClient();

  // Never let an org_admin deactivate themselves.
  if (userId === profile.id) return { error: "You can't deactivate your own account." };

  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId)
    .eq("organization_id", profile.organization_id);
  if (error) return { error: error.message };
  revalidatePath("/admin/team");
  return {};
}
