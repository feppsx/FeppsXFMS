import { PublicShell } from "@/components/PublicShell";
import { PublicReportForm } from "@/components/PublicReportForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const supabase = await createClient();
  const [{ data: clients }, { data: tenants }, { data: categories }] = await Promise.all([
    supabase.from("clients").select("id, name, location").eq("is_active", true).order("name").order("location"),
    supabase.from("client_tenants").select("id, name, client_id").eq("is_active", true).order("name"),
    supabase.from("ticket_categories").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <PublicShell>
      <PublicReportForm
        clients={clients ?? []}
        tenants={tenants ?? []}
        categories={categories ?? []}
      />
    </PublicShell>
  );
}
