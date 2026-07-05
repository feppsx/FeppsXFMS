// Read helper for invoice + line items + before/after photo URLs.
import { createClient } from "@/lib/supabase/server";
import type { Invoice, InvoiceItem, TicketAttachment } from "@/lib/db-types";

export interface InvoiceBundle {
  invoice: Invoice;
  items: InvoiceItem[];
  /** Signed URLs to the requester's original 'before' photos on this ticket. */
  beforePhotos: string[];
  /** Signed URLs to the technician's 'after' / resolution photos on this ticket. */
  afterPhotos: string[];
}

const HOUR = 60 * 60;

/** Load an invoice by its ticket. Returns null if none exists yet. */
export async function getInvoiceForTicket(ticketId: string): Promise<InvoiceBundle | null> {
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("ticket_id", ticketId)
    .maybeSingle<Invoice>();
  if (!invoice) return null;

  const [{ data: items }, { data: attachments }] = await Promise.all([
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice.id)
      .order("sort_order", { ascending: true })
      .returns<InvoiceItem[]>(),
    supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .returns<TicketAttachment[]>(),
  ]);

  const before = (attachments ?? []).filter((a) => a.kind === "issue_photo");
  const after  = (attachments ?? []).filter((a) => a.kind === "resolution_photo");

  async function sign(att: TicketAttachment[]): Promise<string[]> {
    const urls: string[] = [];
    for (const a of att) {
      const { data } = await supabase.storage
        .from("ticket-attachments")
        .createSignedUrl(a.storage_path, HOUR);
      if (data?.signedUrl) urls.push(data.signedUrl);
    }
    return urls;
  }

  const [beforePhotos, afterPhotos] = await Promise.all([sign(before), sign(after)]);

  return { invoice, items: items ?? [], beforePhotos, afterPhotos };
}
