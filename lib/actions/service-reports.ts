"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreateServiceReportInput {
  client_id?: string | null;
  project_name: string;
  service_address?: string | null;
  contact_person?: string | null;
  contact_no?: string | null;
  is_term_agreement?: boolean;
  is_on_call?: boolean;
  is_contract?: boolean;
  is_chargeable?: boolean;
  svc_electrical?: boolean;
  svc_plumbing?: boolean;
  svc_generator?: boolean;
  svc_pump?: boolean;
  svc_fire_panel?: boolean;
  svc_intercom?: boolean;
  svc_cctv?: boolean;
  svc_lighting?: boolean;
  svc_auto_door?: boolean;
  svc_others?: string | null;
  work_description?: string | null;
  recommendation?: string | null;
  customer_name?: string | null;
  service_attended_by?: string | null;
  date_attended?: string | null;
  time_in?: string | null;
  time_out?: string | null;
}

export async function createServiceReport(
  input: CreateServiceReportInput
): Promise<{ error?: string; id?: string; sr_no?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!input.project_name?.trim()) return { error: "Project / Name is required." };

  const { data: inserted, error } = await supabase
    .from("service_reports")
    .insert({
      client_id: input.client_id ?? null,
      created_by: user.id,
      project_name: input.project_name.trim(),
      service_address: input.service_address?.trim() || null,
      contact_person: input.contact_person?.trim() || null,
      contact_no: input.contact_no?.trim() || null,
      is_term_agreement: !!input.is_term_agreement,
      is_on_call: !!input.is_on_call,
      is_contract: !!input.is_contract,
      is_chargeable: !!input.is_chargeable,
      svc_electrical: !!input.svc_electrical,
      svc_plumbing: !!input.svc_plumbing,
      svc_generator: !!input.svc_generator,
      svc_pump: !!input.svc_pump,
      svc_fire_panel: !!input.svc_fire_panel,
      svc_intercom: !!input.svc_intercom,
      svc_cctv: !!input.svc_cctv,
      svc_lighting: !!input.svc_lighting,
      svc_auto_door: !!input.svc_auto_door,
      svc_others: input.svc_others?.trim() || null,
      work_description: input.work_description?.trim() || null,
      recommendation: input.recommendation?.trim() || null,
      customer_name: input.customer_name?.trim() || null,
      service_attended_by: input.service_attended_by?.trim() || null,
      date_attended: input.date_attended || null,
      time_in: input.time_in?.trim() || null,
      time_out: input.time_out?.trim() || null,
    })
    .select("id, sr_no")
    .single<{ id: string; sr_no: string }>();

  if (error || !inserted) return { error: error?.message || "Failed to create service report." };

  revalidatePath("/admin/service-reports");
  revalidatePath("/technician/service-reports");
  return { id: inserted.id, sr_no: inserted.sr_no };
}


export async function updateServiceReport(
  id: string,
  input: CreateServiceReportInput
): Promise<{ error?: string; id?: string; sr_no?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!input.project_name?.trim()) return { error: "Project / Name is required." };

  const { data: updated, error } = await supabase
    .from("service_reports")
    .update({
      client_id: input.client_id ?? null,
      project_name: input.project_name.trim(),
      service_address: input.service_address?.trim() || null,
      contact_person: input.contact_person?.trim() || null,
      contact_no: input.contact_no?.trim() || null,
      is_term_agreement: !!input.is_term_agreement,
      is_on_call: !!input.is_on_call,
      is_contract: !!input.is_contract,
      is_chargeable: !!input.is_chargeable,
      svc_electrical: !!input.svc_electrical,
      svc_plumbing: !!input.svc_plumbing,
      svc_generator: !!input.svc_generator,
      svc_pump: !!input.svc_pump,
      svc_fire_panel: !!input.svc_fire_panel,
      svc_intercom: !!input.svc_intercom,
      svc_cctv: !!input.svc_cctv,
      svc_lighting: !!input.svc_lighting,
      svc_auto_door: !!input.svc_auto_door,
      svc_others: input.svc_others?.trim() || null,
      work_description: input.work_description?.trim() || null,
      recommendation: input.recommendation?.trim() || null,
      customer_name: input.customer_name?.trim() || null,
      service_attended_by: input.service_attended_by?.trim() || null,
      date_attended: input.date_attended || null,
      time_in: input.time_in?.trim() || null,
      time_out: input.time_out?.trim() || null,
    })
    .eq("id", id)
    .select("id, sr_no")
    .maybeSingle<{ id: string; sr_no: string }>();

  if (error) return { error: error.message };
  if (!updated) return { error: "Not allowed to update this service report, or it no longer exists." };

  revalidatePath("/admin/service-reports");
  revalidatePath("/technician/service-reports");
  return { id: updated.id, sr_no: updated.sr_no };
}
