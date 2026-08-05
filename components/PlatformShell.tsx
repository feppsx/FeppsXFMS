"use client";

// Minimal shell for the /platform/* area (FeppsXFMS super admin).
// Sidebar with Dashboard + Organizations, header with sign-out.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, LogOut, ShieldCheck } from "lucide-react";
import { PlatformSearchBar } from "./PlatformSearchBar";

const NAV = [
  { href: "/platform",              label: "Dashboard",     icon: LayoutDashboard },
  { href: "/platform/organizations", label: "Organizations", icon: Building2 },
];

export function PlatformShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-red-600" />
            <div>
              <div className="font-semibold text-slate-900 leading-tight">FeppsXFMS</div>
              <div className="text-xs text-slate-500 leading-tight">Platform</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 ${
                  active
                    ? "border-red-600 bg-red-50 text-red-700 font-medium"
                    : "border-transparent text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-3 border-t border-slate-200 text-xs text-slate-500">
          Signed in as
          <div className="text-slate-900 font-medium text-sm truncate">{adminName}</div>
          <form action="/auth/signout" method="post" className="mt-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 py-2 text-xs font-medium hover:bg-slate-50"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-4">
          <PlatformSearchBar />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
