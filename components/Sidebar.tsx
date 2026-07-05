"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Profile, UserRole } from "@/lib/db-types";
import {
  LayoutDashboard, Ticket, Receipt, Building2, Users, Tag,
  Wrench, UserCircle2, PlusCircle, LogOut, Menu, X, QrCode, ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar } from "./Avatar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  indent?: boolean;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "360 Admin",
  technician: "Technician",
  manager: "Manager",
  requester: "Requester",
};

function navFor(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return [
        { href: "/admin",              label: "Dashboard",       icon: LayoutDashboard },
        { href: "/admin/tickets",      label: "Tickets",         icon: Ticket },
        { href: "/admin/invoices",         label: "Invoices",       icon: Receipt },
        { href: "/admin/invoices/retail",  label: "Invoice Retail", icon: Receipt, indent: true },
        { href: "/admin/invoices/mcst",    label: "Invoice MCST",   icon: Receipt, indent: true },
        { href: "/admin/invoices/sbs",     label: "Invoice SBS",    icon: Receipt, indent: true },
        { href: "/admin/clients",          label: "Estates",        icon: Building2 },
        { href: "/admin/technicians",      label: "Technicians",    icon: Users },
        { href: "/admin/invoices/generate", label: "Generate Invoice", icon: PlusCircle },
        { href: "/admin/managers",         label: "Managers",       icon: ShieldCheck },
        { href: "/admin/categories",       label: "Categories",     icon: Tag },
        { href: "/admin/qr",               label: "Report QR",      icon: QrCode },
      ];
    case "technician":
    case "manager":
      return [
        { href: "/technician/jobs",    label: "My jobs",    icon: Wrench },
        { href: "/technician/profile", label: "My profile", icon: UserCircle2 },
      ];
    case "requester":
      return [
        { href: "/client/tickets",     label: "My tickets",  icon: Ticket },
        { href: "/client/tickets/new", label: "Raise ticket", icon: PlusCircle },
      ];
  }
}

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navFor(profile.role);

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {items.map((item) => {
        // Exact match for indented sub-items (so /admin/invoices/retail
        // doesn't also highlight the parent /admin/invoices link).
        const active = item.indent
          ? pathname === item.href
          : item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href ||
                (pathname.startsWith(item.href + "/") &&
                 // don't let /admin/invoices claim its sub-menu routes
                 !items.some((i) => i.indent && pathname.startsWith(i.href)));
        const Icon = item.icon;
        const baseCls = item.indent
          ? "pl-8 pr-3 py-1.5 text-xs"
          : "px-3 py-2 text-sm";
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={
              (active
                ? "flex items-center gap-3 rounded-lg font-medium bg-brand-50 text-brand "
                : "flex items-center gap-3 rounded-lg text-slate-700 hover:bg-slate-100 ") +
              baseCls
            }
          >
            <Icon className={item.indent ? "w-3 h-3 shrink-0" : "w-4 h-4 shrink-0"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const Footer = () => (
    <div className="border-t border-slate-100 p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar name={profile.full_name} url={profile.avatar_url} size={36} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900 truncate">{profile.full_name}</div>
          <div className="text-xs text-slate-500">{ROLE_LABEL[profile.role]}</div>
        </div>
      </div>
      <div className="space-y-2">
        <ThemeToggle />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  const LogoBlock = () => (
    <div className="px-6 py-5 border-b border-slate-100">
      <Image
        src="/logo.png"
        alt="360 Integrated"
        width={160}
        height={44}
        className="h-11 w-auto object-contain"
        unoptimized
        priority
      />
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-20 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center px-4 gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Image
          src="/logo.png"
          alt="360 Integrated"
          width={110}
          height={30}
          className="h-8 w-auto object-contain"
          unoptimized
          priority
        />
        <div className="ml-auto">
          <ThemeToggle compact />
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={
          "fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col " +
          "transition-transform duration-200 md:translate-x-0 " +
          (open ? "translate-x-0 shadow-pop" : "-translate-x-full md:translate-x-0")
        }
      >
        <div className="flex items-center justify-between md:block">
          <LogoBlock />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden p-2 mr-2 rounded-lg hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <NavLinks />
        <Footer />
      </aside>
    </>
  );
}
