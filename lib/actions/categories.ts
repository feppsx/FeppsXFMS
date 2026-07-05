"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readFields(formData: FormData) {
  const name        = (formData.get("name") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  let color         = (formData.get("color") as string | null)?.trim() || "#64748b";
  // Basic hex validation
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) color = "#64748b";
  return { name, description, color };
}

export async function createCategory(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const fields = readFields(formData);
  if (!fields.name) return { error: "Name is required." };
  const { error } = await supabase.from("ticket_categories").insert(fields);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return {};
}

export async function updateCategory(id: string, formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const fields = readFields(formData);
  if (!fields.name) return { error: "Name is required." };
  const { error } = await supabase.from("ticket_categories").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return {};
}

export async function toggleCategoryActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ticket_categories")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return {};
}
