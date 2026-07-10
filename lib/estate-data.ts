// Aggregate estate + ticket stats for dashboard estate cards.

import { createClient } from "@/lib/supabase/server";
import type { Estate, TicketStatus, UserRole } from "@/lib/db-types";

const OPEN_STATUSES: TicketStatus[] = [
  "submitted", "assigned", "in_progress", "on_hold", "reopened",
];

// What counts as "new / needs attention" depends on the viewer:
//   - admin / manager: tickets waiting for triage (still "submitted")
//   - technician:      tickets freshly assigned to them (still "assigned")
function newStatusesForRole(role: UserRole | null): TicketStatus[] {
  if (role === "technician") return ["assigned"];
  return ["submitted"];
}

export interface EstateCardData {
  id: string;
  name: string;
  location: string;
  category: string;
  new_count: number;
  open_count: number;
  newest_ticket_at: string | null;
}

export async function getEstateCards(): Promise<EstateCardData[]> {
  const supabase = await createClient();

  // Figure out the viewer's role so we know what "new" means for them.
  const { data: { user } } = await supabase.auth.getUser();
  let role: UserRole | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: UserRole }>();
    role = profile?.role ?? null;
  }
  const NEW_STATUSES = newStatusesForRole(role);

  const [{ data: estates }, { data: tickets }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, location, category")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("tickets")
      .select("client_id, status, created_at, updated_at, assigned_at"),
  ]);

  const byEstate = new Map<
    string,
    { new_count: number; open_count: number; newest_ticket_at: string | null }
  >();

  type TRow = {
    client_id: string;
    status: TicketStatus;
    created_at: string;
    updated_at: string;
    assigned_at: string | null;
  };

  for (const t of (tickets ?? []) as TRow[]) {
    const s = byEstate.get(t.client_id) ?? {
      new_count: 0, open_count: 0, newest_ticket_at: null,
    };
    if (NEW_STATUSES.includes(t.status))  s.new_count++;
    if (OPEN_STATUSES.includes(t.status)) s.open_count++;
    const activityAt = t.updated_at || t.assigned_at || t.created_at;
    if (!s.newest_ticket_at || activityAt > s.newest_ticket_at) {
      s.newest_ticket_at = activityAt;
    }
    byEstate.set(t.client_id, s);
  }

  const rows: EstateCardData[] = ((estates ?? []) as Pick<Estate, "id" | "name" | "location" | "category">[])
    .map((e) => {
      const s = byEstate.get(e.id);
      return {
        id: e.id,
        name: e.name,
        location: e.location,
        category: e.category as string,
        new_count: s?.new_count ?? 0,
        open_count: s?.open_count ?? 0,
        newest_ticket_at: s?.newest_ticket_at ?? null,
      };
    });

  rows.sort((a, b) => {
    if (a.newest_ticket_at && b.newest_ticket_at) {
      return a.newest_ticket_at > b.newest_ticket_at ? -1 : 1;
    }
    if (a.newest_ticket_at) return -1;
    if (b.newest_ticket_at) return 1;
    return a.name.localeCompare(b.name);
  });

  return rows;
}
