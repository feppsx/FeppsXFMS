"use server";

// Server actions for FeppsXFMS platform admin. Uses the service_role client
// to create auth users and bypass RLS. Every action here first requires the
// caller to be a platform admin.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/guard";
import { createAdminClient } from "@/lib/supabase/admin";

async function logAudit(input: {
  actorId: string;
  actorEmail: string | null;
  action: string;
  targetOrgId?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("platform_audit_log").insert({
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    action: input.action,
    target_org_id: input.targetOrgId ?? null,
    meta: input.meta ?? null,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function randomPassword(): string {
  // 12 chars, human-shareable: letters + digits + one symbol.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 11; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "!";
}

// ---------------------------------------------------------------------------
// Create a new organization + first org_admin user in one shot.
// ---------------------------------------------------------------------------
export async function createOrganization(formData: FormData): Promise<
  { error?: string; orgId?: string; adminEmail?: string; tempPassword?: string }
> {
  const platformAdmin = await requirePlatformAdmin();

  const name  = (formData.get("name")  as string | null)?.trim() || "";
  const slug  = slugify((formData.get("slug") as string | null) || name);
  const plan  = (formData.get("plan")  as string | null) || "free";
  const email = ((formData.get("admin_email") as string | null) || "").trim().toLowerCase();
  const fullName = ((formData.get("admin_full_name") as string | null) || "").trim();

  if (name.length < 2)       return { error: "Organization name is too short." };
  if (slug.length < 2)       return { error: "Slug must be at least 2 characters (letters, digits, hyphens)." };
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: "Slug can only contain lowercase letters, digits and hyphens." };
  if (!email.includes("@"))  return { error: "Please enter a valid admin email." };
  if (fullName.length < 2)   return { error: "Please enter the admin's full name." };

  const admin = createAdminClient();

  // 1. Create the org.
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name, slug, plan, is_active: true })
    .select("id")
    .single<{ id: string }>();
  if (orgErr || !org) return { error: `Create failed: ${orgErr?.message ?? "unknown"}` };

  // 2. Create the auth user for the first org_admin.
  const password = randomPassword();
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      organization_id: org.id,
      role: "org_admin",
      full_name: fullName,
    },
  });
  if (userErr || !created?.user) {
    // Roll back the org so we don't leak partial state.
    await admin.from("organizations").delete().eq("id", org.id);
    return { error: `User create failed: ${userErr?.message ?? "unknown"}` };
  }

  // The handle_new_auth_user trigger (see v3_patch_1) reads user_metadata
  // and inserts a matching profiles row automatically.

  // Seed a default company_settings row using the org's own name so PDFs
  // don't render "Your Company Name" until they visit /admin/branding.
  await admin.from("company_settings").insert({
    organization_id: org.id,
    company_name: name,
  });

  await logAudit({
    actorId: platformAdmin.id,
    actorEmail: platformAdmin.email,
    action: "create_org",
    targetOrgId: org.id,
    meta: { name, slug, plan, first_admin_email: email },
  });

  revalidatePath("/platform/organizations");
  return { orgId: org.id, adminEmail: email, tempPassword: password };
}

// ---------------------------------------------------------------------------
// Suspend / reactivate.
// ---------------------------------------------------------------------------
export async function setOrgSuspended(
  orgId: string,
  suspended: boolean
): Promise<{ error?: string }> {
  const platformAdmin = await requirePlatformAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ is_suspended: suspended, is_active: !suspended })
    .eq("id", orgId);
  if (error) return { error: error.message };
  await logAudit({
    actorId: platformAdmin.id,
    actorEmail: platformAdmin.email,
    action: suspended ? "suspend_org" : "reactivate_org",
    targetOrgId: orgId,
  });
  revalidatePath(`/platform/organizations/${orgId}`);
  revalidatePath("/platform/organizations");
  return {};
}

// ---------------------------------------------------------------------------
// Delete (permanent).
// ---------------------------------------------------------------------------
export async function deleteOrganization(orgId: string): Promise<{ error?: string }> {
  const platformAdmin = await requirePlatformAdmin();
  const admin = createAdminClient();

  // Prevent deleting the default 360 Integrated org.
  if (orgId === "00000000-0000-0000-0000-000000000360") {
    return { error: "Cannot delete the seed 360 Integrated org." };
  }

  // Cascade delete cascades to all tenant tables (org_id FK on delete cascade)
  // and to all auth users whose profile pointed at this org (via profiles.id
  // cascade to auth.users). We use auth.admin.deleteUser to be explicit.
  const { data: members } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", orgId);

  const { error } = await admin.from("organizations").delete().eq("id", orgId);
  if (error) return { error: error.message };

  // Best-effort cleanup of auth.users rows too.
  const memberRows = ((members ?? []) as unknown) as { id: string }[];
  if (memberRows.length) {
    await Promise.all(memberRows.map((m) => admin.auth.admin.deleteUser(m.id)));
  }

  await logAudit({
    actorId: platformAdmin.id,
    actorEmail: platformAdmin.email,
    action: "delete_org",
    targetOrgId: null,
    meta: { deleted_org_id: orgId, members_deleted: memberRows.length },
  });

  revalidatePath("/platform/organizations");
  redirect("/platform/organizations");
}
