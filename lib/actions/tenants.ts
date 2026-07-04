"use server";

// Server Actions for managing tenants under a client.
// RLS restricts writes to 360 admin.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readFields(formData: FormData) {
  return {
    name:          (formData.get("name") as string | null)?.trim() ?? "",
    contact_email: (formData.get("contact_email") as string | null)?.trim() || null,
    contact_phone: (formData.get("contact_phone") as string | null)?.trim() || null,
    notes:         (formData.get("notes") as string | null)?.trim() || null,
  };
}

export async function createTenant(
  clientId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const fields = readFields(formData);
  if (!fields.name) return { error: "Tenant name is required." };

  const { error } = await supabase
    .from("client_tenants")
    .insert({ ...fields, client_id: clientId });
  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return {};
}

export async function toggleTenantActive(
  tenantId: string,
  clientId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("client_tenants")
    .update({ is_active: isActive })
    .eq("id", tenantId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return {};
}
