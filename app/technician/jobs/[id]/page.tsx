import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TicketDetailHeader } from "@/components/TicketDetailHeader";
import { TicketTimeline } from "@/components/TicketTimeline";
import { TicketPhotoSections } from "@/components/TicketPhotoSections";
import { TechnicianStatusControls } from "@/components/TechnicianStatusControls";
import { TechnicianPhotoUpload } from "@/components/TechnicianPhotoUpload";
import { CommentsThread } from "@/components/CommentsThread";
import { InvoiceSection } from "@/components/InvoiceSection";
import { QuotationSection } from "@/components/QuotationSection";
import { ServiceReportSection } from "@/components/ServiceReportSection";
import { TicketRealtime } from "@/components/TicketRealtime";
import { MobileHeader } from "@/components/MobileHeader";
import { TicketInfoTable } from "@/components/TicketInfoTable";
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

function fmtTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function TechnicianJobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile(["technician", "manager"]);
  const { id } = await params;
  const { ticket, history, attachments, comments, actors, urls } = await getTicketDetail(id);
  const invoiceBundle = await getInvoiceForTicket(id);
  const { feedback: fb, submitterName: fbName } = await getFeedbackForTicket(id);
  const branding = await getCompanyBranding();
  const techSigUrl = await signatureUrl(ticket.assignee?.signature_path);

  const supabase = await createClient();
  const { data: estates } = await supabase
    .from("clients")
    .select("id, name, location, category, address, contact_phone")
    .eq("is_active", true)
    .order("name")
    .returns<Pick<Estate, "id" | "name" | "location" | "category" | "address" | "contact_phone">[]>();

  const customerName =
    (ticket.tenant?.name && ticket.client?.name)
      ? `${ticket.tenant.name} @ ${ticket.client.name}`
      : ticket.client?.name ?? "";
  const customerAddress = [ticket.client?.location, ticket.specific_area].filter(Boolean).join(" · ");

  const invoicePrefill = {
    customer_name: customerName,
    customer_address: customerAddress,
    contact_no: "",
    time_in: fmtTime(ticket.assigned_at),
    time_out: fmtTime(ticket.resolved_at),
  };

  const quotationPrefill = {
    customer_name: customerName,
    customer_address: customerAddress,
    contact_no: "",
    client_id: ticket.client?.id,
    category: (ticket.client as { category?: EstateCategory } | null)?.category as EstateCategory | undefined,
  };

  const srPrefill = {
    project_name: customerName,
    service_address: customerAddress,
    contact_person: ticket.requester_name ?? ticket.raiser?.full_name ?? "",
    contact_no: "",
    client_id: ticket.client?.id,
    work_description: ticket.description,
  };

  return (
    <>
      <MobileHeader
        title={ticket.client?.name ?? "Job"}
        subtitle={ticket.title}
        showBack
        backHref="/technician/jobs"
      />
      <AppShell profile={profile}>
        <TicketRealtime ticketId={ticket.id} />
        {/* Desktop-only back link + header (mobile uses MobileHeader above) */}
        <div className="hidden md:block">
          <Link href="/technician/jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to jobs
          </Link>
          <TicketDetailHeader ticket={ticket} client={ticket.client} tenant={ticket.tenant} category={ticket.category} />
        </div>
        {/* Mobile-only compact info table (light blue card) */}
        <div className="md:hidden mb-4">
          <TicketInfoTable ticket={ticket} />
        </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Section title="Description">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
          </Section>
          <Section title="Photos">
            <TicketPhotoSections attachments={attachments} urls={urls} />
          </Section>
          <Section title="Status controls">
            <TechnicianStatusControls ticketId={ticket.id} status={ticket.status} />
          </Section>
          <Section title="Progress photo">
            <TechnicianPhotoUpload ticketId={ticket.id} kind="progress_photo" title="Upload photos during work" />
          </Section>
          <Section title="Resolution photo">
            <TechnicianPhotoUpload ticketId={ticket.id} kind="resolution_photo" title="Upload proof of fix before Mark resolved" />
          </Section>
          <Section title="Raised by">
            <p className="text-sm text-slate-700">{ticket.raiser?.full_name ?? "—"}</p>
          </Section>
          <Section title="Generate Quotation">
            <QuotationSection estates={estates ?? []} prefill={quotationPrefill} branding={branding} />
          </Section>
          <Section title="Invoice">
            <InvoiceSection
              branding={branding}
              ticketId={ticket.id}
              existingInvoice={invoiceBundle?.invoice ?? null}
              existingItems={invoiceBundle?.items ?? []}
              ticketIsResolved={ticket.status === "resolved" || ticket.status === "closed"}
              prefill={invoicePrefill}
              technicianSignatureUrl={techSigUrl}
              beforePhotos={invoiceBundle?.beforePhotos ?? []}
              afterPhotos={invoiceBundle?.afterPhotos ?? []}
            />
          </Section>
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
          <Section title="Timeline">
            <TicketTimeline history={history} actors={actors} />
          </Section>
        </div>
      </div>
      </AppShell>
    </>
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
