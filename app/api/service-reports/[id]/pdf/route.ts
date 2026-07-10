import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { ServiceReportPDF, type ServiceReportPdfInput } from "@/components/ServiceReportPDF";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sr, error } = await supabase
    .from("service_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle<ServiceReportPdfInput>();

  if (error || !sr) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = await renderToBuffer(createElement(ServiceReportPDF as any, { sr }) as any);

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${sr.sr_no}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
