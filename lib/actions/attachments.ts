"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttachmentKind } from "@/lib/db-types";

/**
 * Called by the technician's photo widget after a file is uploaded
 * client-side to Supabase Storage. Records the storage path + kind.
 */
export async function attachPhotosToTicket(
  ticketId: string,
  photos: { path: string; name: string }[],
  kind: AttachmentKind
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (photos.length === 0) return {};

  const rows = photos.map((p) => ({
    ticket_id: ticketId,
    uploaded_by: user.id,
    storage_path: p.path,
    file_name: p.name,
    kind,
  }));

  const { error } = await supabase.from("ticket_attachments").insert(rows);
  if (error) return { error: error.message };

  revalidatePath(`/client/tickets/${ticketId}`);
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath(`/technician/jobs/${ticketId}`);
  return {};
}
