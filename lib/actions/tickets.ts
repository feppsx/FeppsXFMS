"use server";

// Server Actions for ticket mutations.
// All mutations rely on RLS — we never bypass it, we just call the DB as the
// current user and Postgres enforces who can do what. If RLS rejects a write,
// the action returns an error string.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TicketStatus } from "@/lib/db-types";
import { checkTicketMonthlyCap } from "@/lib/plans";

// ---------------------------------------------------------------------------
// Create a ticket (requester).
// ---------------------------------------------------------------------------
export async function createTicket(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const title         = (formData.get("title") as string | null)?.trim();
  const description   = (formData.get("description") as string | null)?.trim();
  const client_id     = formData.get("client_id") as string | null;
  const tenant_id     = (formData.get("tenant_id") as string | null) || null;
  const category_id   = (formData.get("category_id") as string | null) || null;
  const priority      = (formData.get("priority") as string | null) ?? "medium";
  const specific_area = (formData.get("specific_area") as string | null)?.trim() || null;
  const unit_number   = (formData.get("unit_number") as string | null)?.trim() || null;

  if (!title || title.length < 3) return { error: "Please enter a short title." };
  if (!description) return { error: "Please describe the problem." };
  if (!client_id)   return { error: "Please pick a client (Location)." };

  // Plan enforcement: Free tier caps tickets/month. Look up the requester's
  // org from their profile.
  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle<{ organization_id: string }>();
  if (prof?.organization_id) {
    const check = await checkTicketMonthlyCap(prof.organization_id);
    if (!check.ok) return { error: check.error };
  }

  const { data: inserted, error } = await supabase
    .from("tickets")
    .insert({
      title,
      description,
      client_id,
      tenant_id,
      category_id,
      priority,
      specific_area,
      unit_number,
      raised_by: user.id,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Attach any uploaded photos (uploaded client-side; paths in hidden inputs).
  const photoPaths = formData.getAll("photo_paths").filter(Boolean) as string[];
  const photoNames = formData.getAll("photo_names").filter(Boolean) as string[];
  if (photoPaths.length) {
    const rows = photoPaths.map((path, i) => ({
      ticket_id: inserted.id,
      uploaded_by: user.id,
      storage_path: path,
      file_name: photoNames[i] ?? path.split("/").pop() ?? "photo.jpg",
      kind: "issue_photo" as const,
    }));
    const { error: attErr } = await supabase.from("ticket_attachments").insert(rows);
    if (attErr) console.error("attachment insert failed:", attErr.message);
  }

  revalidatePath("/client/tickets");
  redirect(`/client/tickets/${inserted.id}`);
}

// ---------------------------------------------------------------------------
// Admin assigns a technician.
// ---------------------------------------------------------------------------
export async function assignTechnician(
  ticketId: string,
  technicianId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("tickets")
    .update({
      assigned_to: technicianId,
      assigned_by: user.id,
      assigned_at: new Date().toISOString(),
      status: "assigned",
    })
    .eq("id", ticketId);

  if (error) return { error: error.message };

  // Admin surfaces
  revalidatePath("/admin");
  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/calendar");
  // Technician / Manager surfaces (the assignee needs to see it immediately)
  revalidatePath("/technician/jobs");
  revalidatePath(`/technician/jobs/${ticketId}`);
  revalidatePath("/technician/calendar");
  revalidatePath("/technician/estates");
  return {};
}

// ---------------------------------------------------------------------------
// Technician updates status: start / pause / resolve.
// ---------------------------------------------------------------------------
export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tickets")
    .update({ status: newStatus })
    .eq("id", ticketId);

  if (error) return { error: error.message };

  revalidatePath(`/technician/jobs/${ticketId}`);
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath(`/client/tickets/${ticketId}`);
  revalidatePath("/technician/jobs");
  revalidatePath("/technician/calendar");
  revalidatePath("/admin");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin/calendar");
  return {};
}

// ---------------------------------------------------------------------------
// Requester confirms fix (closed) or rejects it (reopened).
// ---------------------------------------------------------------------------
export async function clientCloseOrReopen(
  ticketId: string,
  action: "close" | "reopen"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const status: TicketStatus = action === "close" ? "closed" : "reopened";

  const { error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) return { error: error.message };

  revalidatePath(`/client/tickets/${ticketId}`);
  revalidatePath("/client/tickets");
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  revalidatePath("/admin");
  revalidatePath(`/technician/jobs/${ticketId}`);
  revalidatePath("/technician/jobs");
  return {};
}
