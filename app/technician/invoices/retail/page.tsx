import { AppShell } from "@/components/AppShell";
import { InvoicesListView } from "@/components/InvoicesListView";
import { requireProfile } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function TechInvoicesRetailPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const profile = await requireProfile(["technician", "manager"]);
  const { paid = "all" } = await searchParams;

  return (
    <AppShell profile={profile}>
      <InvoicesListView
        title="Invoices — Retail"
        subtitle="Only invoices tied to Retail estates."
        backHref="/technician/invoices"
        paidFilter={paid}
        forcedCategory="Retail"
        ticketHrefBase="/technician/jobs"
      />
    </AppShell>
  );
}
