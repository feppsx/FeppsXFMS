"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface QuotationItemInput {
  description: string;
  unit_price: number;
}

export interface CreateQuotationInput {
  client_id?: string | null;
  category?: string | null;
  customer_name: string;
  customer_address?: string | null;
  contact_no?: string | null;
  quotation_date?: string;
  valid_until?: string | null;
  discount?: number;
  gst_amount?: number;
  notes?: string | null;
  items: QuotationItemInput[];
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0;
}

export async function createQuotation(
  input: CreateQuotationInput
): Promise<{ error?: string; id?: string; quotation_no?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const items = input.items
    .map((i) => ({ description: i.description.trim(), unit_price: num(i.unit_price) }))
    .filter((i) => i.description.length > 0);
  if (items.length === 0) return { error: "Add at least one line item." };
  if (!input.customer_name.trim()) return { error: "Customer name is required." };

  const discount = num(input.discount);
  const gst      = num(input.gst_amount);
  const subtotal = items.reduce((s, i) => s + i.unit_price, 0);
  const grand_total = Math.max(0, Math.round((subtotal - discount + gst) * 100) / 100);

  const { data: inserted, error: invErr } = await supabase
    .from("quotations")
    .insert({
      client_id: input.client_id ?? null,
      category: input.category ?? null,
      created_by: user.id,
      customer_name: input.customer_name.trim(),
      customer_address: input.customer_address?.trim() || null,
      contact_no: input.contact_no?.trim() || null,
      quotation_date: input.quotation_date || new Date().toISOString().slice(0, 10),
      valid_until: input.valid_until || null,
      subtotal,
      discount,
      gst_amount: gst,
      grand_total,
      notes: input.notes?.trim() || null,
    })
    .select("id, quotation_no")
    .single<{ id: string; quotation_no: string }>();

  if (invErr || !inserted) return { error: invErr?.message || "Failed to create quotation." };

  const itemRows = items.map((it, idx) => ({
    quotation_id: inserted.id,
    description: it.description,
    unit_price: it.unit_price,
    sort_order: idx,
  }));
  const { error: itemsErr } = await supabase.from("quotation_items").insert(itemRows);
  if (itemsErr) return { error: `Header saved but items failed: ${itemsErr.message}` };

  revalidatePath("/admin/quotations");
  revalidatePath("/technician/quotations");
  return { id: inserted.id, quotation_no: inserted.quotation_no };
}


export async function updateQuotation(
  id: string,
  input: CreateQuotationInput
): Promise<{ error?: string; id?: string; quotation_no?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const items = input.items
    .map((i) => ({ description: i.description.trim(), unit_price: num(i.unit_price) }))
    .filter((i) => i.description.length > 0);
  if (items.length === 0) return { error: "Add at least one line item." };
  if (!input.customer_name.trim()) return { error: "Customer name is required." };

  const discount = num(input.discount);
  const gst      = num(input.gst_amount);
  const subtotal = items.reduce((s, i) => s + i.unit_price, 0);
  const grand_total = Math.max(0, Math.round((subtotal - discount + gst) * 100) / 100);

  const { data: updated, error: upErr } = await supabase
    .from("quotations")
    .update({
      client_id: input.client_id ?? null,
      category: input.category ?? null,
      customer_name: input.customer_name.trim(),
      customer_address: input.customer_address?.trim() || null,
      contact_no: input.contact_no?.trim() || null,
      quotation_date: input.quotation_date || new Date().toISOString().slice(0, 10),
      valid_until: input.valid_until || null,
      subtotal, discount, gst_amount: gst, grand_total,
      notes: input.notes?.trim() || null,
    })
    .eq("id", id)
    .select("id, quotation_no")
    .single<{ id: string; quotation_no: string }>();

  if (upErr || !updated) return { error: upErr?.message || "Failed to update quotation." };

  await supabase.from("quotation_items").delete().eq("quotation_id", id);
  const itemRows = items.map((it, idx) => ({
    quotation_id: id, description: it.description, unit_price: it.unit_price, sort_order: idx,
  }));
  const { error: itemsErr } = await supabase.from("quotation_items").insert(itemRows);
  if (itemsErr) return { error: `Header saved but items failed: ${itemsErr.message}` };

  revalidatePath("/admin/quotations");
  revalidatePath("/technician/quotations");
  return { id: updated.id, quotation_no: updated.quotation_no };
}
