import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { NewTicketForm } from "@/components/NewTicketForm";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewTicketPage() {
  const profile = await requireProfile(["requester"]);
  const supabase = await createClient();

  const [{ data: clients }, { data: tenants }, { data: categories }] = await Promise.all([
    supabase.from("clients").select("id, name, location").eq("is_active", true).order("name").order("location"),
    supabase.from("client_tenants").select("id, name, client_id").eq("is_active", true).order("name"),
    supabase.from("ticket_categories").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <AppShell profile={profile}>
      <Link href="/client/tickets" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <h1 className="text-xl font-semibold mb-4">Raise a ticket</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <NewTicketForm
          clients={clients ?? []}
          tenants={tenants ?? []}
          categories={categories ?? []}
        />
      </div>
    </AppShell>
  );
}
