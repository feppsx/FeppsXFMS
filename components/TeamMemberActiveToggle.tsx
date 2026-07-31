"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setTeamMemberActive } from "@/lib/actions/invitations";

export function TeamMemberActiveToggle({
  userId,
  isActive,
  disabled,
}: {
  userId: string;
  isActive: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await setTeamMemberActive(userId, !isActive);
    setBusy(false);
    if (res.error) { alert(res.error); return; }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || disabled}
      className={
        isActive
          ? "text-xs text-slate-600 hover:text-red-700 disabled:opacity-40"
          : "text-xs text-emerald-700 hover:text-emerald-900 disabled:opacity-40"
      }
      title={disabled ? "You can't change your own status" : undefined}
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
