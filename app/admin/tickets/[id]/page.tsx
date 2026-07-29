import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TicketDetailHeader } from "@/components/TicketDetailHeader";
import { TicketTimeline } from "@/components/TicketTimeline";
import { TicketPhotoSections } from "@/components/TicketPhotoSections";
import { AssignTechnicianForm, type TechOption } from "@/components/AssignTechnicianForm";
import { ScheduleWidget } from "@/components/ScheduleWidget";
import { CommentsThread } from "@/components/CommentsThread";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import { QuotationSection } from "@/components/QuotationSection";
import { ServiceReportSection } from "@/components/ServiceReportSection";
import { TicketRealtime } from "@/components/TicketRealtime";
import { FeedbackView } from "@/components/FeedbackView";
import { getFeedbackForTicket } from "@/lib/feedback-data";
import { getCompanyBranding } from "@/lib/company-settings-data";
import { requireProfile } from "@/lib/guard";
import { getTicketDetail } from "@/lib/ticket-data";
import { getInvoiceForTicket } from "@/lib/invoice-data";
import { signatureUrl } from "@/lib/signature-url";
import { createClient } from "@/lib/supabase/server";
import type { Estate, EstateCategory } from "@/lib/db-types";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface TechRow {
  id: string;
  full_name: string;
  technician_trades: { category: { name: string } | null }[];
}

export default async function AdminTicketDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile(["admin"]);
  const { id } = await params;
  const { ticket, history, attachments, comments, actors, urls } = await getTicketDetail(id);
  const invoiceBundle = await getInvoiceForTicket(id);
  const { feedback: fb, submitterName: fbName } = await getFeedbackForTicket(id);
  const branding = await getCompanyBranding();
  const techSigUrl = await signatureUrl(ticket.assignee?.signature_path);

  const supabase = await createClient();
  const { data: techRows } = await supabase
    .from("profiles")
    .select(`id, full_name, technician_trades:technician_trades!technician_id(category:ticket_categories(name))`)
    .eq("role", "technician").eq("is_active", true)
    .order("full_name")
    .returns<TechRow[]>();

  const technicians: TechOption[] = (techRows ?? []).map((t) => ({
    id: t.id,
    full_name: t.full_name,
    trades: (t.technician_trades ?? []).map((tt) => tt.category?.name).filter(Boolean) as string[],
  }));

  const { data: estates } = await supabase
    .from("clients")
    .select("id, name, location, category, address, contact_phone")
    .eq("is_active", true)
    .order("name")
    .returns<Pick<Estate, "id" | "name" | "location" | "category" | "address" | "contact_phone">[]>();

  const customerName = ticket.client?.name ?? ticket.requester_name ?? "";
  const customerAddress = [ticket.client?.location, ticket.specific_area].filter(Boolean).join(" · ");
  const contactNo = ticket.requester_phone ?? "";
  const quotationPrefill = {
    customer_name: customerName,
    customer_address: customerAddress,
    contact_no: contactNo,
    client_id: ticket.client?.id,
    category: (ticket.client as { category?: EstateCategory } | null)?.category as EstateCategory | undefined,
  };
  const srPrefill = {
    project_name: customerName,
    service_address: customerAddress,
    contact_person: ticket.requester_name ?? "",
    contact_no: contactNo,
    client_id: ticket.client?.id,
    work_description: ticket.description,
  };

  return (
    <AppShell profile={profile}>
      <TicketRealtime ticketId={ticket.id} />
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" /> Back to queue
      </Link>
      <TicketDetailHeader ticket={ticket} client={ticket.client} tenant={ticket.tenant} category={ticket.category} />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Section title="Description">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
          </Section>
          <Section title="Photos">
            <TicketPhotoSections attachments={attachments} urls={urls} />
          </Section>
          {ticket.raised_by ? (
            <Section title="Raised by">
              <p className="text-sm text-slate-700">{ticket.raiser?.full_name ?? "—"}</p>
            </Section>
          ) : (
            <Section title="Anonymous submission — contact">
              <div className="space-y-1 text-sm">
                <div><span className="text-slate-500">Name:</span> <span className="text-slate-800 font-medium">{ticket.requester_name ?? "—"}</span></div>
                <div><span className="text-slate-500">Email:</span> {ticket.requester_email ? (<a href={`mailto:${ticket.requester_email}`} className="text-brand hover:underline">{ticket.requester_email}</a>) : "—"}</div>
                <div><span className="text-slate-500">Phone:</span> {ticket.requester_phone ? (<a href={`tel:${ticket.requester_phone}`} className="text-brand hover:underline">{ticket.requester_phone}</a>) : "—"}</div>
                {ticket.tracking_token && (
                  <div className="pt-1"><span className="text-slate-500">Tracking code:</span> <span className="font-mono font-medium text-slate-800">{ticket.tracking_token}</span></div>
                )}
              </div>
            </Section>
          )}
          <Section title="Generate Quotation">
            <QuotationSection estates={estates ?? []} prefill={quotationPrefill} branding={branding} />
          </Section>
          {invoiceBundle ? (
            <Section title="Invoice">
              <div className="space-y-2">
                <div className="text-sm text-slate-700">
                  <span className="font-mono font-medium">{invoiceBundle.invoice.receipt_no}</span> —{" "}
                  <span className="font-semibold">
                    S$ {invoiceBundle.invoice.grand_total.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <InvoiceDownloadButton branding={branding} invoice={invoiceBundle.invoice} items={invoiceBundle.items} technicianSignatureUrl={techSigUrl} beforePhotos={invoiceBundle.beforePhotos} afterPhotos={invoiceBundle.afterPhotos} />
              </div>
            </Section>
          ) : (
            <Section title="Invoice">
              <p className="text-xs text-slate-500">No invoice yet. The assigned technician can generate one after resolving the ticket.</p>
            </Section>
          )}
          <Section title="Generate Service Report">
            <ServiceReportSection estates={estates ?? []} prefill={srPrefill} branding={branding} />
          </Section>
          <Section title="Customer feedback">
            <FeedbackView feedback={fb} submitterName={fbName} />
          </Section>
          <Section title="Comments">
            <CommentsThread ticketId={ticket.id} currentUserRole={profile.role} currentUserId={profile.id} comments={comments} actors={actors} />
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Assignment">
            <AssignTechnicianForm ticketId={ticket.id} technicians={technicians} currentAssignee={ticket.assigned_to} ticketCategoryName={ticket.category?.name ?? null} />
            {ticket.assignee && (
              <p className="text-xs text-slate-500 mt-2">
                Currently assigned: <span className="font-medium">{ticket.assignee.full_name}</span>
              </p>
            )}
          </Section>
          <Section title="Scheduled visit">
            <ScheduleWidget ticketId={ticket.id} scheduledAt={ticket.scheduled_at} durationMinutes={ticket.scheduled_duration_minutes} />
          </Section>
          <Section title="Timeline">
            <TicketTimeline history={history} actors={actors} />
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4">
      <h2 className="text-sm font-medium text-slate-500 mb-2">{title}</h2>
      {children}
    </section>
  );
}
