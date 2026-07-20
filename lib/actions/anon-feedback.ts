"use server";

// Anonymous feedback: reached from /track/[token] after the ticket is resolved.
// Uses the SERVICE-ROLE Supabase client so RLS is bypassed cleanly. We validate
// the token → ticket_id mapping ourselves, ensure the ticket is resolved/closed,
// and enforce the one-feedback-per-ticket rule.

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface SubmitAnonFeedbackInput {
  token: string;
  rating: number;
  would_recommend: boolean | null;
  comment?: string | null;
}

export async function submitAnonFeedback(
  input: SubmitAnonFeedbackInput
): Promise<{ error?: string; ok?: boolean }> {
  const token = (input.token ?? "").trim().toUpperCase();
  if (!token) return { error: "Missing tracking code." };

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  if (!(rating >= 1 && rating <= 5)) return { error: "Please pick a rating." };

  const admin = createAdminClient();

  const { data: ticket } = await admin
    .from("tickets")
    .select("id, status, raised_by")
    .eq("tracking_token", token)
    .maybeSingle<{ id: string; status: string; raised_by: string | null }>();

  if (!ticket) return { error: "Tracking code not found." };
  if (ticket.raised_by !== null) {
    return { error: "This ticket has a registered owner. Please sign in to leave feedback." };
  }
  if (ticket.status !== "resolved" && ticket.status !== "closed") {
    return { error: "You can only rate a ticket after it's been resolved." };
  }

  // Enforce one feedback per ticket.
  const { data: existing } = await admin
    .from("ticket_feedback")
    .select("id")
    .eq("ticket_id", ticket.id)
    .maybeSingle<{ id: string }>();
  if (existing) return { error: "Feedback has already been submitted for this ticket." };

  const { error } = await admin.from("ticket_feedback").insert({
    ticket_id: ticket.id,
    rating,
    would_recommend: input.would_recommend,
    comment: input.comment?.trim() || null,
    submitted_by: null,
    submitted_via: "tracking-token",
  });
  if (error) return { error: error.message };

  revalidatePath(`/track/${token}`);
  revalidatePath(`/admin/tickets/${ticket.id}`);
  revalidatePath(`/technician/jobs/${ticket.id}`);
  return { ok: true };
}
