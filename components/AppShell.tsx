import type { Profile } from "@/lib/db-types";
import { Sidebar } from "./Sidebar";

/**
 * Signed-in shell: fixed sidebar on the left (md+),
 * top hamburger bar on mobile, content in the middle.
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
      <main className="md:pl-64 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
