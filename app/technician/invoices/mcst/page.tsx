import { AppShell } from "@/components/AppShell";
import { InvoicesListView } from "@/components/InvoicesListView";
import { requireProfile } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function TechInvoicesMcstPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const profile = await requireProfile(["technician", "manager"]);
  const { paid = "all" } = await searchParams;

  return (
    <AppShell profile={profile}>
      <InvoicesListView
        title="Invoices — MCST"
        subtitle="Only invoices tied to MCST estates."
        backHref="/technician/invoices"
        paidFilter={paid}
        forcedCategory="MCST"
        ticketHrefBase="/technician/jobs"
      />
    </AppShell>
  );
}
