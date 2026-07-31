import { AppShell } from "@/components/AppShell";
import { MobileHeader } from "@/components/MobileHeader";
import { NotificationsList } from "@/components/NotificationsList";
import { requireProfile } from "@/lib/guard";
import { getNotifications } from "@/lib/notifications-data";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const profile = await requireProfile(["org_admin"]);
  const items = await getNotifications(30);
  return (
    <>
      <MobileHeader title="Notifications" showBack backHref="/admin" />
      <AppShell profile={profile}>
        <div className="hidden md:flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-brand-blue" />
          <h1 className="text-xl font-semibold">Notifications</h1>
        </div>
        <NotificationsList items={items} />
      </AppShell>
    </>
  );
}
