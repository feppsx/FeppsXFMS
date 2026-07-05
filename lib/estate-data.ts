// Aggregate estate + ticket stats for dashboard estate cards.
// Two lightweight queries + in-JS aggregation is fine at this scale.

import { createClient } from "@/lib/supabase/server";
import type { Estate, TicketStatus } from "@/lib/db-types";

const NEW_STATUSES: TicketStatus[]  = ["submitted"];
const OPEN_STATUSES: TicketStatus[] = [
  "submitted", "assigned", "in_progress", "on_hold", "reopened",
];

export interface EstateCardData {
  id: string;
  name: string;
  location: string;
  category: string;
  new_count: number;
  open_count: number;
  newest_ticket_at: string | null;   // ISO
}

/** Fetch active estates and enrich with per-estate ticket stats. */
export async function getEstateCards(): Promise<EstateCardData[]> {
  const supabase = await createClient();

  const [{ data: estates }, { data: tickets }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, location, category")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("tickets")
      .select("client_id, status, created_at"),
  ]);

  const byEstate = new Map<
    string,
    { new_count: number; open_count: number; newest_ticket_at: string | null }
  >();

  for (const t of (tickets ?? []) as { client_id: string; status: TicketStatus; created_at: string }[]) {
    const s = byEstate.get(t.client_id) ?? {
      new_count: 0, open_count: 0, newest_ticket_at: null,
    };
    if (NEW_STATUSES.includes(t.status))  s.new_count++;
    if (OPEN_STATUSES.includes(t.status)) s.open_count++;
    if (!s.newest_ticket_at || t.created_at > s.newest_ticket_at) {
      s.newest_ticket_at = t.created_at;
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

  // Sort: newest ticket first; estates without any tickets go last, alphabetical.
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
