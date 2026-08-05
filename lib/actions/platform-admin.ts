"use server";

// Platform-admin power tools:
//   - startImpersonation      : begins impersonation (consent-aware)
//   - pollImpersonation       : poll for approval; on approved, return token
//   - resetUserPassword       : generate a new password for any tenant user
//   - platformInviteMember    : add a team member into a specific org
//   - setOrgConsentRequired   : per-org "require consent for impersonation" flag
//
// Every mutating action writes a row to platform_audit_log.

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/db-types";

const ALLOWED_ROLES: UserRole[] = ["org_admin", "manager", "technician", "requester"];

function randomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 11; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "!";
}

async function logAudit(input: {
  actorId: string;
  actorEmail: string | null;
  action: string;
  targetOrgId?: string | null;
  targetUserId?: string | null;
  reason?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("platform_audit_log").insert({
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    action: input.action,
    target_org_id: input.targetOrgId ?? null,
    target_user_id: input.targetUserId ?? null,
    reason: input.reason ?? null,
    meta: input.meta ?? null,
  });
}

// ---------------------------------------------------------------------------
// Generate the actual magic-link token for the target user. Callers should
// only reach this once consent (if required) has been granted.
// ---------------------------------------------------------------------------
async function generateImpersonationToken(userId: string): Promise<{
  error?: string;
  email?: string;
  tokenHash?: string;
}> {
  const admin = createAdminClient();
  const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId);
  if (getErr || !target?.user?.email) {
    return { error: `Could not find user: ${getErr?.message ?? "no email"}` };
  }
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: target.user.email,
  });
  if (linkErr || !link?.properties?.hashed_token) {
    return { error: `Could not generate impersonation token: ${linkErr?.message ?? "unknown"}` };
  }
  return { email: target.user.email, tokenHash: link.properties.hashed_token };
}

// ---------------------------------------------------------------------------
// startImpersonation — reason is required. If the target org requires
// consent, creates a pending row; caller then polls. Otherwise returns the
// token immediately.
// ---------------------------------------------------------------------------
export async function startImpersonation(
  userId: string,
  reason: string
): Promise<{
  error?: string;
  status?: "ready" | "pending";
  email?: string;
  tokenHash?: string;
  requestId?: string;
}> {
  const platformAdmin = await requirePlatformAdmin();
  const trimmedReason = (reason || "").trim();
  if (trimmedReason.length < 5) return { error: "Please enter a reason (min 5 chars)." };

  const admin = createAdminClient();

  // Look up the target's org + the org's consent flag.
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle<{ organization_id: string }>();
  if (!profile) return { error: "Target user has no profile row." };

  const { data: org } = await admin
    .from("organizations")
    .select("require_impersonation_consent")
    .eq("id", profile.organization_id)
    .maybeSingle<{ require_impersonation_consent: boolean }>();
  const consentRequired = !!org?.require_impersonation_consent;

  if (!consentRequired) {
    // No consent needed — return token immediately, log audit.
    const tok = await generateImpersonationToken(userId);
    if (tok.error) return { error: tok.error };
    await logAudit({
      actorId: platformAdmin.id,
      actorEmail: platformAdmin.email,
      action: "impersonate_user",
      targetOrgId: profile.organization_id,
      targetUserId: userId,
      reason: trimmedReason,
      meta: { consent: "not_required" },
    });
    return { status: "ready", email: tok.email, tokenHash: tok.tokenHash };
  }

  // Consent required — create a pending request row.
  const { data: req, error: reqErr } = await admin
    .from("impersonation_requests")
    .insert({
      target_user_id: userId,
      target_org_id: profile.organization_id,
      requested_by: platformAdmin.id,
      reason: trimmedReason,
      status: "pending",
    })
    .select("id")
    .single<{ id: string }>();
  if (reqErr || !req) return { error: `Could not create request: ${reqErr?.message ?? "unknown"}` };

  await logAudit({
    actorId: platformAdmin.id,
    actorEmail: platformAdmin.email,
    action: "impersonate_request",
    targetOrgId: profile.organization_id,
    targetUserId: userId,
    reason: trimmedReason,
    meta: { request_id: req.id },
  });

  return { status: "pending", requestId: req.id };
}

// ---------------------------------------------------------------------------
// pollImpersonation — check the status of a pending request. If approved,
// generate + return the token and mark the request consumed.
// ---------------------------------------------------------------------------
export async function pollImpersonation(requestId: string): Promise<{
  error?: string;
  status?: "pending" | "approved" | "denied" | "expired";
  email?: string;
  tokenHash?: string;
}> {
  const platformAdmin = await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data: req } = await admin
    .from("impersonation_requests")
    .select("*")
    .eq("id", requestId)
    .eq("requested_by", platformAdmin.id)
    .maybeSingle<{
      id: string;
      target_user_id: string;
      target_org_id: string;
      status: string;
      expires_at: string;
      reason: string;
    }>();
  if (!req) return { error: "Request not found." };

  if (new Date(req.expires_at).getTime() < Date.now() && req.status === "pending") {
    await admin.from("impersonation_requests").update({ status: "expired" }).eq("id", req.id);
    return { status: "expired" };
  }
  if (req.status === "denied")  return { status: "denied" };
  if (req.status === "pending") return { status: "pending" };
  if (req.status === "expired") return { status: "expired" };

  // Approved (or already consumed) — generate token, mark consumed.
  if (req.status === "approved") {
    const tok = await generateImpersonationToken(req.target_user_id);
    if (tok.error) return { error: tok.error };
    await admin
      .from("impersonation_requests")
      .update({ status: "consumed", consumed_at: new Date().toISOString() })
      .eq("id", req.id);
    await logAudit({
      actorId: platformAdmin.id,
      actorEmail: platformAdmin.email,
      action: "impersonate_user",
      targetOrgId: req.target_org_id,
      targetUserId: req.target_user_id,
      reason: req.reason,
      meta: { consent: "granted", request_id: req.id },
    });
    return { status: "approved", email: tok.email, tokenHash: tok.tokenHash };
  }

  return { error: `Unexpected status: ${req.status}` };
}

// ---------------------------------------------------------------------------
// cancelImpersonation — platform admin gives up waiting.
// ---------------------------------------------------------------------------
export async function cancelImpersonation(requestId: string): Promise<{ error?: string }> {
  const platformAdmin = await requirePlatformAdmin();
  const admin = createAdminClient();
  await admin
    .from("impersonation_requests")
    .update({ status: "denied", decided_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("requested_by", platformAdmin.id)
    .eq("status", "pending");
  return {};
}

// ---------------------------------------------------------------------------
// 2. Reset a tenant user's password.
// ---------------------------------------------------------------------------
export async function resetUserPassword(userId: string): Promise<{
  error?: string;
  email?: string;
  tempPassword?: string;
}> {
  const platformAdmin = await requirePlatformAdmin();
  const admin = createAdminClient();

  const password = randomPassword();
  const { data, error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error || !data?.user) return { error: error?.message ?? "Reset failed." };

  // Look up org for the log entry.
  const { data: prof } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle<{ organization_id: string }>();

  await logAudit({
    actorId: platformAdmin.id,
    actorEmail: platformAdmin.email,
    action: "reset_user_password",
    targetOrgId: prof?.organization_id ?? null,
    targetUserId: userId,
  });

  return { email: data.user.email ?? "", tempPassword: password };
}

// ---------------------------------------------------------------------------
// 3. Add a team member into a specific org.
// ---------------------------------------------------------------------------
export async function platformInviteMember(
  orgId: string,
  formData: FormData
): Promise<{ error?: string; email?: string; tempPassword?: string }> {
  const platformAdmin = await requirePlatformAdmin();
  const admin = createAdminClient();

  const email    = ((formData.get("email") as string | null) || "").trim().toLowerCase();
  const fullName = ((formData.get("full_name") as string | null) || "").trim();
  const role     = ((formData.get("role") as string | null) || "").trim() as UserRole;

  if (!email.includes("@")) return { error: "Please enter a valid email." };
  if (fullName.length < 2)  return { error: "Please enter the person's full name." };
  if (!ALLOWED_ROLES.includes(role)) return { error: "Pick a valid role." };

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

  await logAudit({
    actorId: platformAdmin.id,
    actorEmail: platformAdmin.email,
    action: "invite_member",
    targetOrgId: orgId,
    targetUserId: created.user.id,
    meta: { role, email },
  });

  revalidatePath(`/platform/organizations/${orgId}`);
  return { email, tempPassword: password };
}

// ---------------------------------------------------------------------------
// 5. Change an org's plan (manual — before Stripe).
// ---------------------------------------------------------------------------
export async function changeOrgPlan(
  orgId: string,
  plan: string
): Promise<{ error?: string }> {
  const platformAdmin = await requirePlatformAdmin();
  const admin = createAdminClient();

  if (!["free", "pro", "business", "enterprise"].includes(plan)) {
    return { error: "Unknown plan." };
  }

  const { error } = await admin
    .from("organizations")
    .update({ plan })
    .eq("id", orgId);
  if (error) return { error: error.message };

  await logAudit({
    actorId: platformAdmin.id,
    actorEmail: platformAdmin.email,
    action: "change_org_plan",
    targetOrgId: orgId,
    meta: { new_plan: plan },
  });

  revalidatePath(`/platform/organizations/${orgId}`);
  return {};
}

// ---------------------------------------------------------------------------
// 4. Toggle the per-org "require consent for impersonation" flag.
// ---------------------------------------------------------------------------
export async function setOrgConsentRequired(
  orgId: string,
  required: boolean
): Promise<{ error?: string }> {
  const platformAdmin = await requirePlatformAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("organizations")
    .update({ require_impersonation_consent: required })
    .eq("id", orgId);
  if (error) return { error: error.message };

  await logAudit({
    actorId: platformAdmin.id,
    actorEmail: platformAdmin.email,
    action: required ? "enable_consent" : "disable_consent",
    targetOrgId: orgId,
  });

  revalidatePath(`/platform/organizations/${orgId}`);
  return {};
}
