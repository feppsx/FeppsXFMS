import { AppShell } from "@/components/AppShell";
import { CategoryManager } from "@/components/CategoryManager";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { TicketCategory } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const profile = await requireProfile(["admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("ticket_categories")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name")
    .returns<TicketCategory[]>();

  return (
    <AppShell profile={profile}>
      <h1 className="text-xl font-semibold mb-1">Ticket categories</h1>
      <p className="text-sm text-slate-500 mb-4">
        These show up in the ticket form dropdown and are used to match technician trades.
      </p>
      <CategoryManager categories={data ?? []} />
    </AppShell>
  );
}
