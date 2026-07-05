import { headers } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { QrDisplay } from "@/components/QrDisplay";
import { requireProfile } from "@/lib/guard";
import { QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminQrPage() {
  const profile = await requireProfile(["admin"]);

  // Build the fully-qualified /report URL from the incoming request.
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/report`;

  return (
    <AppShell profile={profile}>
      <div className="flex items-center gap-2 mb-2">
        <QrCode className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold">Report QR</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6 max-w-2xl">
        Print this QR and stick it around the premises. When someone scans it, the report form opens
        and they can raise a ticket without needing an account.
      </p>

      <QrDisplay url={url} />
    </AppShell>
  );
}
