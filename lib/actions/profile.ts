"use server";

// Self-service profile editing (name, phone, signature).
// Runs as the signed-in user; RLS lets them update their own row.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateOwnProfile(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const full_name       = (formData.get("full_name") as string | null)?.trim();
  const phone           = (formData.get("phone") as string | null)?.trim() || null;
  const signature_path  = (formData.get("signature_path") as string | null) || null;
  const avatar_url      = (formData.get("avatar_url") as string | null) || null;

  if (!full_name) return { error: "Name is required." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone, signature_path, avatar_url })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/technician/profile");
  revalidatePath("/technician/jobs");
  return {};
}
