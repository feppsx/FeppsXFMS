import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TicketDetailHeader } from "@/components/TicketDetailHeader";
import { TicketTimeline } from "@/components/TicketTimeline";
import { TicketPhotoSections } from "@/components/TicketPhotoSections";
import { ClientTicketActions } from "@/components/ClientTicketActions";
import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackView } from "@/components/FeedbackView";
import { getFeedbackForTicket } from "@/lib/feedback-data";
import { CommentsThread } from "@/components/CommentsThread";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import { TicketRealtime } from "@/components/TicketRealtime";
import { requireProfile } from "@/lib/guard";
import { getTicketDetail } from "@/lib/ticket-data";
import { getInvoiceForTicket } from "@/lib/invoice-data";
import { signatureUrl } from "@/lib/signature-url";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RequesterTicketDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile(["requester"]);
  const { id } = await params;
  const { ticket, history, attachments, comments, actors, urls } = await getTicketDetail(id);
  const { feedback, submitterName } = await getFeedbackForTicket(id);
  const invoiceBundle = await getInvoiceForTicket(id);
  const techSigUrl = await signatureUrl(ticket.assignee?.signature_path);

  const canCloseOrReopen =
    ticket.status === "resolved" && ticket.raised_by === profile.id;

  return (
    <AppShell profile={profile}>
      <TicketRealtime ticketId={ticket.id} />
      <Link
        href="/client/tickets"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      <TicketDetailHeader
        ticket={ticket}
        client={ticket.client}
        tenant={ticket.tenant}
        category={ticket.category}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Section title="Description">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
          </Section>

          <Section title="Photos">
            <TicketPhotoSections attachments={attachments} urls={urls} />
          </Section>

          {canCloseOrReopen && (
            <Section title="Confirm resolution">
              <ClientTicketActions ticketId={ticket.id} />
            </Section>
          )}

          {(ticket.status === "resolved" || ticket.status === "closed") && (
            <Section title="Rate this service">
              {feedback ? <FeedbackView feedback={feedback} submitterName={submitterName} /> : <FeedbackForm ticketId={ticket.id} />}
            </Section>
          )}

          {invoiceBundle && (
            <Section title="Invoice">
              <div className="space-y-2">
                <div className="text-sm text-slate-700">
                  <span className="font-mono font-medium">{invoiceBundle.invoice.receipt_no}</span> —{" "}
                  <span className="font-semibold">
                    S$ {invoiceBundle.invoice.grand_total.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <InvoiceDownloadButton invoice={invoiceBundle.invoice} items={invoiceBundle.items} technicianSignatureUrl={techSigUrl} beforePhotos={invoiceBundle.beforePhotos} afterPhotos={invoiceBundle.afterPhotos} />
              </div>
            </Section>
          )}
          <Section title="Comments">
            <CommentsThread
              ticketId={ticket.id}
              currentUserRole={profile.role}
              currentUserId={profile.id}
              comments={comments}
              actors={actors}
            />
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Assigned to">
            <p className="text-sm text-slate-700">
              {ticket.assignee?.full_name ?? (
                <span className="text-slate-500">Waiting for assignment…</span>
              )}
            </p>
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
