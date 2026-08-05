"use server";

// Platform-admin power tools:
//   - impersonateUser        : sign in as any tenant user (for support)
//   - resetUserPassword      : generate a new password for any tenant user
//   - platformInviteMember   : add a team member into a specific org
//
// All guarded by requirePlatformAdmin.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requirePlatformAdmin } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/db-types";

const ALLOWED_ROLES: UserRole[] = ["org_admin", "manager", "technician", "requester"];

function randomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 11; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "!";
}

async function siteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------------------
// 1. Impersonate a tenant user (support flow).
// Signs the platform admin out, then redirects to a one-time magic link that
// signs in as the target user. Platform admin ends the impersonation by
// signing out (which returns them to /login).
// ---------------------------------------------------------------------------
export async function impersonateUser(userId: string): Promise<{ error?: string }> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId);
  if (getErr || !target?.user?.email) {
    return { error: `Could not find user: ${getErr?.message ?? "no email"}` };
  }

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: target.user.email,
    options: { redirectTo: `${await siteUrl()}/` },
  });
  if (linkErr || !link?.properties?.action_link) {
    return { error: `Could not generate impersonation link: ${linkErr?.message ?? "unknown"}` };
  }

  // Kill the platform admin's session so the browser cleanly picks up the
  // impersonated user's cookies from the callback.
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect(link.properties.action_link);
}

// ---------------------------------------------------------------------------
// 2. Reset a tenant user's password. Returns the new temp password once.
// ---------------------------------------------------------------------------
export async function resetUserPassword(userId: string): Promise<{
  error?: string;
  email?: string;
  tempPassword?: string;
}> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const password = randomPassword();
  const { data, error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error || !data?.user) return { error: error?.message ?? "Reset failed." };

  return { email: data.user.email ?? "", tempPassword: password };
}

// ---------------------------------------------------------------------------
// 3. Add a team member into a specific org (platform admin can pick the org).
// Mirrors the org_admin invite flow but with an explicit orgId parameter.
// ---------------------------------------------------------------------------
export async function platformInviteMember(
  orgId: string,
  formData: FormData
): Promise<{ error?: string; email?: string; tempPassword?: string }> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const email    = ((formData.get("email") as string | null) || "").trim().toLowerCase();
  const fullName = ((formData.get("full_name") as string | null) || "").trim();
  const role     = ((formData.get("role") as string | null) || "").trim() as UserRole;

  if (!email.includes("@")) return { error: "Please enter a valid email." };
  if (fullName.length < 2)  return { error: "Please enter the person's full name." };
  if (!ALLOWED_ROLES.includes(role)) return { error: "Pick a valid role." };

  // Verify org exists.
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .maybeSingle<{ id: string }>();
  if (!org) return { error: "Organization not found." };

  const password = randomPassword();
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      organization_id: orgId,
      role,
      full_name: fullName,
    },
  });
  if (userErr || !created?.user) {
    return { error: `Invite failed: ${userErr?.message ?? "unknown"}` };
  }

  revalidatePath(`/platform/organizations/${orgId}`);
  return { email, tempPassword: password };
}
