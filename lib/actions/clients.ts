"use server";

// Server Actions for the admin's "Manage Clients" page.
// RLS restricts these to users with role='admin'.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readFields(formData: FormData) {
  return {
    name:          (formData.get("name") as string | null)?.trim() ?? "",
    location:      (formData.get("location") as string | null)?.trim() ?? "",
    address:       (formData.get("address") as string | null)?.trim() || null,
    contact_email: (formData.get("contact_email") as string | null)?.trim() || null,
    contact_phone: (formData.get("contact_phone") as string | null)?.trim() || null,
    notes:         (formData.get("notes") as string | null)?.trim() || null,
  };
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const fields = readFields(formData);
  if (!fields.name)     return { error: "Name is required." };
  if (!fields.location) return { error: "Location is required." };

  const { error } = await supabase.from("clients").insert(fields);
  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function updateClientRecord(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = readFields(formData);
  if (!fields.name)     return { error: "Name is required." };
  if (!fields.location) return { error: "Location is required." };

  const { error } = await supabase.from("clients").update(fields).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  redirect("/admin/clients");
}

export async function toggleClientActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/clients");
  return {};
}
