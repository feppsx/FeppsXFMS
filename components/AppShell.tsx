import type { Profile } from "@/lib/db-types";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";

/**
 * Responsive signed-in shell.
 *   - Desktop (md+): existing left sidebar + wide content area (unchanged).
 *   - Mobile (< md): sidebar is hidden by its own CSS; instead the page
 *     provides its own MobileHeader (via each page), and this shell renders
 *     the fixed red bottom nav. Bottom padding leaves room for the nav.
 */
export function AppShell({
  profile, children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar profile={profile} />
      <main className="md:pl-64 pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-6">{children}</div>
      </main>
      <MobileBottomNav role={profile.role} />
    </div>
  );
}
