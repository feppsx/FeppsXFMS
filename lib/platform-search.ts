// Server-side global search across every tenant. Uses the service_role client
// so it can span orgs. Never call from a client component — only server.
import { createAdminClient } from "@/lib/supabase/admin";

export interface SearchHit {
  kind: "org" | "user" | "ticket" | "invoice";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export async function platformSearch(rawQuery: string): Promise<SearchHit[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];

  const admin = createAdminClient();
  const like = `%${q}%`;

  const [orgs, users, tickets, invoices] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, slug, plan")
      .or(`name.ilike.${like},slug.ilike.${like}`)
      .limit(8),
    admin
      .from("profiles")
      .select("id, full_name, role, organization_id, organizations(name)")
      .ilike("full_name", like)
      .limit(8),
    admin
      .from("tickets")
      .select("id, ticket_number, title, organization_id, organizations(name)")
      .or(`ticket_number.ilike.${like},title.ilike.${like}`)
      .limit(8),
    admin
      .from("invoices")
      .select("id, receipt_no, customer_name, organization_id, organizations(name)")
      .or(`receipt_no.ilike.${like},customer_name.ilike.${like}`)
      .limit(8),
  ]);

  const hits: SearchHit[] = [];

  ((orgs.data ?? []) as unknown as Array<{ id: string; name: string; slug: string; plan: string }>).forEach((o) =>
    hits.push({
      kind: "org",
      id: o.id,
      title: o.name,
      subtitle: `${o.slug} · ${o.plan} plan`,
      href: `/platform/organizations/${o.id}`,
    })
  );

  ((users.data ?? []) as unknown as Array<{
    id: string; full_name: string; role: string; organization_id: string;
    organizations: { name: string } | null;
  }>).forEach((u) =>
    hits.push({
      kind: "user",
      id: u.id,
      title: u.full_name,
      subtitle: `${u.role.replace("_", " ")} · ${u.organizations?.name ?? "unknown org"}`,
      href: `/platform/organizations/${u.organization_id}`,
    })
  );

  ((tickets.data ?? []) as unknown as Array<{
    id: string; ticket_number: string; title: string; organization_id: string;
    organizations: { name: string } | null;
  }>).forEach((t) =>
    hits.push({
      kind: "ticket",
      id: t.id,
      title: `${t.ticket_number} — ${t.title}`,
      subtitle: t.organizations?.name ?? "unknown org",
      href: `/platform/organizations/${t.organization_id}`,
    })
  );

  ((invoices.data ?? []) as unknown as Array<{
    id: string; receipt_no: string; customer_name: string; organization_id: string;
    organizations: { name: string } | null;
  }>).forEach((i) =>
    hits.push({
      kind: "invoice",
      id: i.id,
      title: `${i.receipt_no} — ${i.customer_name}`,
      subtitle: i.organizations?.name ?? "unknown org",
      href: `/platform/organizations/${i.organization_id}`,
    })
  );

  return hits;
}
