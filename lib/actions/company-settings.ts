"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/guard";

export interface UpdateCompanySettingsInput {
  logo_path?: string | null;
  logo_dark_path?: string | null;
  stamp_path?: string | null;
  company_name: string;
  tagline?: string | null;
  uen: string;
  gst_reg?: string | null;
  address_line?: string | null;
  phone_office?: string | null;
  phone_hotline?: string | null;
  phone_whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  badges_line?: string | null;
  invoice_terms?: string | null;
  quotation_terms?: string | null;
  paynow_text?: string | null;
}

export async function updateCompanySettings(
  input: UpdateCompanySettingsInput
): Promise<{ error?: string; ok?: boolean }> {
  await requireProfile(["org_admin"]);
  const supabase = await createClient();

  if (!input.company_name?.trim()) return { error: "Company name is required." };
  if (!input.uen?.trim()) return { error: "UEN is required." };

  // Find existing row (there is only ever one).
  const { data: existing } = await supabase
    .from("company_settings")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  const payload = {
    ...input,
    company_name: input.company_name.trim(),
    uen: input.uen.trim(),
  };

  if (existing) {
    const { error } = await supabase
      .from("company_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("company_settings").insert({ ...payload, singleton_lock: true });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/branding");
  return { ok: true };
}
