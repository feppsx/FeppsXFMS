"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { InviteTeamMemberForm } from "./InviteTeamMemberForm";
import { TeamMemberActiveToggle } from "./TeamMemberActiveToggle";
import type { Profile } from "@/lib/db-types";

const ROLE_LABEL: Record<Profile["role"], string> = {
  org_admin: "Admin",
  manager:   "Manager",
  technician:"Technician",
  requester: "Requester",
};

export function TeamPageClient({
  members,
  currentUserId,
}: {
  members: Profile[];
  currentUserId: string;
}) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500 mt-1">{members.length} people in your organization.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700"
        >
          <UserPlus className="w-4 h-4" /> Invite member
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Phone</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-900">{m.full_name}</div>
                </td>
                <td className="px-5 py-3 text-slate-600">{ROLE_LABEL[m.role] ?? m.role}</td>
                <td className="px-5 py-3 text-slate-500">{m.phone ?? "—"}</td>
                <td className="px-5 py-3">
                  {m.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">Inactive</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <TeamMemberActiveToggle
                    userId={m.id}
                    isActive={m.is_active}
                    disabled={m.id === currentUserId}
                  />
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No team members yet. Click <b>Invite member</b> to add the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showInvite && <InviteTeamMemberForm onClose={() => setShowInvite(false)} />}
    </>
  );
}
