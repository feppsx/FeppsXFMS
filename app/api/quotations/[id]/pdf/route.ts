import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { QuotationPDF, type QuotationPdfInput } from "@/components/QuotationPDF";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: q, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      quotation_no: string;
      quotation_date: string;
      valid_until: string | null;
      customer_name: string;
      customer_address: string | null;
      contact_no: string | null;
      subtotal: number;
      discount: number;
      gst_amount: number;
      grand_total: number;
      notes: string | null;
    }>();

  if (error || !q) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("quotation_items")
    .select("description, unit_price, sort_order")
    .eq("quotation_id", id)
    .order("sort_order", { ascending: true });

  const input: QuotationPdfInput = {
    quotation_no: q.quotation_no,
    quotation_date: q.quotation_date,
    valid_until: q.valid_until,
    customer_name: q.customer_name,
    customer_address: q.customer_address,
    contact_no: q.contact_no,
    subtotal: Number(q.subtotal),
    discount: Number(q.discount),
    gst_amount: Number(q.gst_amount),
    grand_total: Number(q.grand_total),
    notes: q.notes,
    items: (items ?? []).map((i) => ({ description: i.description, unit_price: Number(i.unit_price) })),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = await renderToBuffer(createElement(QuotationPDF as any, { q: input }) as any);

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${q.quotation_no}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
