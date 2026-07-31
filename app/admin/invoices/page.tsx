import { AppShell } from "@/components/AppShell";
import { InvoicesListView } from "@/components/InvoicesListView";
import { requireProfile } from "@/lib/guard";

export const dynamic = "force-dynamic";

interface SP {
  paid?: string;
  category?: string;
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const profile = await requireProfile(["org_admin"]);
  const sp = await searchParams;
  const paid = sp.paid ?? "all";
  const category = sp.category ?? "all";

  return (
    <AppShell profile={profile}>
      <InvoicesListView
        title="Invoices"
        paidFilter={paid}
        selectableCategory={{
          current: category,
          basePath: "/admin/invoices",
          paid,
        }}
      />
    </AppShell>
  );
}
