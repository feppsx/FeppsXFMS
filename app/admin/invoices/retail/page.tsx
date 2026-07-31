import { AppShell } from "@/components/AppShell";
import { InvoicesListView } from "@/components/InvoicesListView";
import { requireProfile } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function InvoicesRetailPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const profile = await requireProfile(["org_admin"]);
  const { paid = "all" } = await searchParams;

  return (
    <AppShell profile={profile}>
      <InvoicesListView
        title="Invoices — Retail"
        subtitle="Only invoices tied to Retail estates."
        backHref="/admin/invoices"
        paidFilter={paid}
        forcedCategory="Retail"
      />
    </AppShell>
  );
}
