"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function postComment(
  ticketId: string,
  body: string,
  isInternal: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Say something." };
  if (trimmed.length > 4000) return { error: "Too long (max 4000 chars)." };

  const { error } = await supabase.from("ticket_comments").insert({
    ticket_id: ticketId,
    author_id: user.id,
    body: trimmed,
    is_internal: isInternal,
  });

  if (error) return { error: error.message };

  revalidatePath(`/client/tickets/${ticketId}`);
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath(`/technician/jobs/${ticketId}`);
  return {};
}
