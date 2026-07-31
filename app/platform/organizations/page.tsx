// List all orgs with quick status + link to detail.
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organization } from "@/lib/db-types";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  const list = ((orgs ?? []) as unknown) as Organization[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Organizations</h1>
          <p className="text-sm text-slate-500 mt-1">{list.length} total.</p>
        </div>
        <Link
          href="/platform/organizations/new"
          className="inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700"
        >
          <Plus className="w-4 h-4" /> New organization
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Slug</th>
              <th className="text-left px-5 py-3">Plan</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Created</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((o) => (
              <tr key={o.id}>
                <td className="px-5 py-3 font-medium text-slate-900">{o.name}</td>
                <td className="px-5 py-3 text-slate-600">{o.slug}</td>
                <td className="px-5 py-3 text-slate-600 capitalize">{o.plan}</td>
                <td className="px-5 py-3">
                  {o.is_suspended ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">Suspended</span>
                  ) : o.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">Inactive</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/platform/organizations/${o.id}`}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  No organizations yet. Click <b>New organization</b> to add the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
