"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const name        = (formData.get("name") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  if (!name) return { error: "Name is required." };

  const { error } = await supabase.from("ticket_categories").insert({ name, description });
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return {};
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const name        = (formData.get("name") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  if (!name) return { error: "Name is required." };

  const { error } = await supabase
    .from("ticket_categories")
    .update({ name, description })
    .eq("id", id);
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
