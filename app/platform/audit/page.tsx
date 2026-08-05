import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface AuditRow {
  id: string;
  actor_email: string | null;
  action: string;
  target_org_id: string | null;
  target_user_id: string | null;
  reason: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  organizations: { name: string } | null;
}

const ACTION_LABEL: Record<string, string> = {
  impersonate_user:     "Impersonated user",
  impersonate_request:  "Requested impersonation",
  reset_user_password:  "Reset password",
  invite_member:        "Invited team member",
  enable_consent:       "Enabled consent-required",
  disable_consent:      "Disabled consent-required",
  create_org:           "Created org",
  suspend_org:          "Suspended org",
  reactivate_org:       "Reactivated org",
  delete_org:           "Deleted org",
};

export default async function AuditLogPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_audit_log")
    .select("id, actor_email, action, target_org_id, target_user_id, reason, meta, created_at, organizations(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = ((data ?? []) as unknown) as AuditRow[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
        <p className="text-sm text-slate-500 mt-1">Last 200 platform-admin actions.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">When</th>
              <th className="text-left px-5 py-3">Actor</th>
              <th className="text-left px-5 py-3">Action</th>
              <th className="text-left px-5 py-3">Org</th>
              <th className="text-left px-5 py-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-2 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-2 text-slate-700">{r.actor_email ?? "—"}</td>
                <td className="px-5 py-2 text-slate-900 font-medium">
                  {ACTION_LABEL[r.action] ?? r.action}
                </td>
                <td className="px-5 py-2 text-slate-700">
                  {r.target_org_id ? (
                    <Link href={`/platform/organizations/${r.target_org_id}`} className="text-red-600 hover:text-red-700">
                      {r.organizations?.name ?? "unknown"}
                    </Link>
                  ) : "—"}
                </td>
                <td className="px-5 py-2 text-slate-600 text-xs max-w-md truncate" title={r.reason ?? ""}>
                  {r.reason ?? "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No audit events yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
