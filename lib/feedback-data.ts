import { createClient } from "@/lib/supabase/server";
import type { TicketFeedback } from "@/lib/db-types-feedback";

export async function getFeedbackForTicket(ticketId: string): Promise<{
  feedback: TicketFeedback | null;
  submitterName: string | null;
}> {
  const supabase = await createClient();
  const { data: fb } = await supabase
    .from("ticket_feedback")
    .select("*")
    .eq("ticket_id", ticketId)
    .maybeSingle<TicketFeedback>();
  if (!fb) return { feedback: null, submitterName: null };

  let submitterName: string | null = null;
  if (fb.submitted_by) {
    const { data: p } = await supabase
      .from("profiles").select("full_name").eq("id", fb.submitted_by).maybeSingle<{ full_name: string }>();
    submitterName = p?.full_name ?? null;
  }
  return { feedback: fb, submitterName };
}

/** Average CSAT (1-5) across ratings submitted since start-of-month. Null when none. */
export async function getCsatThisMonth(): Promise<{ avg: number | null; count: number }> {
  const supabase = await createClient();
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("ticket_feedback")
    .select("rating")
    .gte("created_at", start.toISOString());
  const rows = (data ?? []) as { rating: number }[];
  if (rows.length === 0) return { avg: null, count: 0 };
  const total = rows.reduce((s, r) => s + r.rating, 0);
  return { avg: Math.round((total / rows.length) * 10) / 10, count: rows.length };
}
