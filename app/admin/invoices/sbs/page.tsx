import { AppShell } from "@/components/AppShell";
import { InvoicesListView } from "@/components/InvoicesListView";
import { requireProfile } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function InvoicesSbsPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const profile = await requireProfile(["admin"]);
  const { paid = "all" } = await searchParams;

  return (
    <AppShell profile={profile}>
      <InvoicesListView
        title="Invoices — SBS"
        subtitle="Only invoices tied to SBS estates."
        backHref="/admin/invoices"
        paidFilter={paid}
        forcedCategory="SBS"
      />
    </AppShell>
  );
}
