import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { NewClientForm } from "@/components/NewClientForm";
import { TenantManager } from "@/components/TenantManager";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { Client, ClientTenant } from "@/lib/db-types";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile(["admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: tenants }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>(),
    supabase.from("client_tenants").select("*").eq("client_id", id)
      .order("is_active", { ascending: false }).order("name")
      .returns<ClientTenant[]>(),
  ]);

  if (!client) notFound();

  return (
    <AppShell profile={profile}>
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to estates
      </Link>

      <h1 className="text-xl font-semibold mb-4">
        Edit estate — {client.name} · {client.location}
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-medium text-slate-500 mb-3">Estate details</h2>
          <NewClientForm initial={client} />
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-medium text-slate-500 mb-3">Tenants inside this estate</h2>
          <TenantManager clientId={client.id} tenants={tenants ?? []} />
        </section>
      </div>
    </AppShell>
  );
}
