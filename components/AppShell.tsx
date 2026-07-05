// Shared signed-in layout shell (header + role-based nav + sign-out).
import Link from "next/link";
import type { Profile } from "@/lib/db-types";
import { LogOut } from "lucide-react";

const ROLE_LABEL: Record<Profile["role"], string> = {
  admin: "360 Admin",
  technician: "Technician",
  requester: "Requester",
};

function navLinksForRole(role: Profile["role"]): { href: string; label: string }[] {
  switch (role) {
    case "admin":
      return [
        { href: "/admin", label: "Tickets" },
        { href: "/admin/clients", label: "Clients" },
        { href: "/admin/technicians", label: "Technicians" },
      ];
    case "technician":
      return [
        { href: "/technician/jobs", label: "My jobs" },
        { href: "/technician/profile", label: "My profile" },
      ];
    case "requester":
      return [
        { href: "/client/tickets", label: "My tickets" },
        { href: "/client/tickets/new", label: "Raise ticket" },
      ];
  }
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const nav = navLinksForRole(profile.role);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-brand font-semibold">
              360 Integrated
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-slate-700 hover:text-brand"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right leading-tight">
              <div className="font-medium">{profile.full_name}</div>
              <div className="text-slate-500 text-xs">{ROLE_LABEL[profile.role]}</div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
