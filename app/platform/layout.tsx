import { requirePlatformAdmin } from "@/lib/guard";
import { PlatformShell } from "@/components/PlatformShell";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requirePlatformAdmin();
  return <PlatformShell adminName={admin.full_name}>{children}</PlatformShell>;
}
