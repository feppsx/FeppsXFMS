"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SubmitFeedbackInput {
  ticket_id: string;
  rating: number;
  would_recommend: boolean | null;
  comment?: string | null;
}

export async function submitFeedback(
  input: SubmitFeedbackInput
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));

  const { error } = await supabase.from("ticket_feedback").insert({
    ticket_id: input.ticket_id,
    rating,
    would_recommend: input.would_recommend,
    comment: input.comment?.trim() || null,
    submitted_by: user.id,
    submitted_via: "app",
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already submitted feedback for this ticket." };
    return { error: error.message };
  }

  revalidatePath(`/client/tickets/${input.ticket_id}`);
  revalidatePath(`/admin/tickets/${input.ticket_id}`);
  revalidatePath(`/technician/jobs/${input.ticket_id}`);
  revalidatePath("/admin");
  return { ok: true };
}
