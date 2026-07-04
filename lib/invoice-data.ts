// Read helper for invoice + line items.
import { createClient } from "@/lib/supabase/server";
import type { Invoice, InvoiceItem } from "@/lib/db-types";

export interface InvoiceBundle {
  invoice: Invoice;
  items: InvoiceItem[];
}

/** Load an invoice by its ticket. Returns null if none exists yet. */
export async function getInvoiceForTicket(ticketId: string): Promise<InvoiceBundle | null> {
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("ticket_id", ticketId)
    .maybeSingle<Invoice>();
  if (!invoice) return null;

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoice.id)
    .order("sort_order", { ascending: true })
    .returns<InvoiceItem[]>();

  return { invoice, items: items ?? [] };
}
