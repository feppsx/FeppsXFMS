import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TicketDetailHeader } from "@/components/TicketDetailHeader";
import { TicketTimeline } from "@/components/TicketTimeline";
import { TicketPhotoSections } from "@/components/TicketPhotoSections";
import { TechnicianStatusControls } from "@/components/TechnicianStatusControls";
import { TechnicianPhotoUpload } from "@/components/TechnicianPhotoUpload";
import { CommentsThread } from "@/components/CommentsThread";
import { InvoiceSection } from "@/components/InvoiceSection";
import { TicketRealtime } from "@/components/TicketRealtime";
import { requireProfile } from "@/lib/guard";
import { getTicketDetail } from "@/lib/ticket-data";
import { getInvoiceForTicket } from "@/lib/invoice-data";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default async function TechnicianJobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile(["technician"]);
  const { id } = await params;
  const { ticket, history, attachments, comments, actors, urls } = await getTicketDetail(id);
  const invoiceBundle = await getInvoiceForTicket(id);

  const customerName =
    (ticket.tenant?.name && ticket.client?.name)
      ? `${ticket.tenant.name} @ ${ticket.client.name}`
      : ticket.client?.name ?? "";

  const customerAddress = [ticket.client?.location, ticket.specific_area]
    .filter(Boolean).join(" · ");

  const prefill = {
    customer_name:    customerName,
    customer_address: customerAddress,
    contact_no:       "",
    time_in:          fmtTime(ticket.assigned_at),
    time_out:         fmtTime(ticket.resolved_at),
  };

  return (
    <AppShell profile={profile}>
      <TicketRealtime ticketId={ticket.id} />
      <Link href="/technician/jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" />
        Back to jobs
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
          <Section title="Status controls">
            <TechnicianStatusControls ticketId={ticket.id} status={ticket.status} />
          </Section>
          <Section title="Progress photo">
            <TechnicianPhotoUpload ticketId={ticket.id} kind="progress_photo" title="Upload photos during work" />
          </Section>
          <Section title="Resolution photo">
            <TechnicianPhotoUpload ticketId={ticket.id} kind="resolution_photo" title="Upload proof of fix before Mark resolved" />
          </Section>
          <Section title="Invoice">
            <InvoiceSection
              ticketId={ticket.id}
              existingInvoice={invoiceBundle?.invoice ?? null}
              existingItems={invoiceBundle?.items ?? []}
              ticketIsResolved={ticket.status === "resolved" || ticket.status === "closed"}
              prefill={prefill}
            />
          </Section>
          <Section title="Raised by">
            <p className="text-sm text-slate-700">{ticket.raiser?.full_name ?? "—"}</p>
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
