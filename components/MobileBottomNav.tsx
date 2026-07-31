"use client";

// Fixed bottom nav shown on mobile (< md).
// Role-aware: destinations differ per user role but the 4 icons stay the same
// (Home / Calendar / Bell / User). Uses a red pill panel with rounded top corners
// to match the design mockup.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/db-types";
import { Home, CalendarDays, Bell, UserCircle2 } from "lucide-react";

interface Dest {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function destsFor(role: UserRole): Dest[] {
  switch (role) {
    case "org_admin":
      return [
        { href: "/admin",              label: "Home",     icon: Home },
        { href: "/admin/calendar",     label: "Calendar", icon: CalendarDays },
        { href: "/admin/notifications", label: "Alerts",  icon: Bell },
        { href: "/admin/account",      label: "Account",  icon: UserCircle2 },
      ];
    case "technician":
    case "manager":
      return [
        { href: "/technician/jobs",          label: "Home",     icon: Home },
        { href: "/technician/calendar",      label: "Calendar", icon: CalendarDays },
        { href: "/technician/notifications", label: "Alerts",   icon: Bell },
        { href: "/technician/profile",       label: "Profile",  icon: UserCircle2 },
      ];
    case "requester":
      return [
        { href: "/client/tickets",     label: "Home",       icon: Home },
        { href: "/client/tickets/new", label: "New ticket", icon: CalendarDays },
        { href: "/client/notifications", label: "Alerts",   icon: Bell },
        { href: "/client/account",     label: "Account",    icon: UserCircle2 },
      ];
  }
}

export function MobileBottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const dests = destsFor(role);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-brand-red rounded-t-[25px] shadow-float">
      <ul className="flex items-center justify-around px-2 pt-3 pb-4">
        {dests.map((d) => {
          const active = pathname === d.href || pathname.startsWith(d.href + "/");
          const Icon = d.icon;
          return (
            <li key={d.href} className="flex-1">
              <Link
                href={d.href}
                aria-label={d.label}
                className={
                  "flex flex-col items-center gap-0.5 py-1 text-white " +
                  (active ? "opacity-100" : "opacity-70 hover:opacity-100")
                }
              >
                <Icon className="w-6 h-6" />
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
