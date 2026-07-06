"use server";

// Set / clear a ticket's scheduled visit. RLS on tickets already covers who
// can update — admins full access, technicians only their assigned tickets.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setTicketSchedule(
  ticketId: string,
  scheduledAt: string | null,   // ISO or null to clear
  durationMinutes = 60
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const duration = Math.max(15, Math.min(24 * 60, Math.round(durationMinutes)));

  const { error } = await supabase
    .from("tickets")
    .update({
      scheduled_at: scheduledAt,
      scheduled_duration_minutes: duration,
    })
    .eq("id", ticketId);

  if (error) return { error: error.message };

  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/technician/jobs");
  revalidatePath(`/technician/jobs/${ticketId}`);
  revalidatePath("/technician/calendar");
  return {};
}
