import { AppShell } from "@/components/AppShell";
import { MobileHeader } from "@/components/MobileHeader";
import { requireProfile } from "@/lib/guard";
import { Avatar } from "@/components/Avatar";
import { LogOut, UserCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLE_LABEL = { org_admin: "Admin", technician: "Technician", manager: "Manager", requester: "Requester" } as const;

export default async function AdminAccountPage() {
  const profile = await requireProfile(["org_admin"]);
  return (
    <>
      <MobileHeader title="Account" showBack backHref="/admin" />
      <AppShell profile={profile}>
        <div className="max-w-md mx-auto">
          <div className="hidden md:flex items-center gap-2 mb-4">
            <UserCircle2 className="w-5 h-5 text-brand-blue" />
            <h1 className="text-xl font-semibold">Account</h1>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar name={profile.full_name} url={profile.avatar_url} size={56} />
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">{profile.full_name}</div>
                <div className="text-sm text-slate-500">{ROLE_LABEL[profile.role]}</div>
              </div>
            </div>
            <form action="/auth/signout" method="post" className="mt-5">
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 py-2.5 text-sm font-medium hover:bg-slate-50">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </AppShell>
    </>
  );
}
