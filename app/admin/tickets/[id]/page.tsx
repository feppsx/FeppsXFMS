import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TicketDetailHeader } from "@/components/TicketDetailHeader";
import { TicketTimeline } from "@/components/TicketTimeline";
import { TicketPhotoSections } from "@/components/TicketPhotoSections";
import { AssignTechnicianForm, type TechOption } from "@/components/AssignTechnicianForm";
import { CommentsThread } from "@/components/CommentsThread";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import { TicketRealtime } from "@/components/TicketRealtime";
import { requireProfile } from "@/lib/guard";
import { getTicketDetail } from "@/lib/ticket-data";
import { getInvoiceForTicket } from "@/lib/invoice-data";
import { signatureUrl } from "@/lib/signature-url";
import { createClient } from "@/lib/supabase/server";
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
  const techSigUrl = await signatureUrl(ticket.assignee?.signature_path);

  const supabase = await createClient();
  const { data: techRows } = await supabase
    .from("profiles")
    .select(`
      id, full_name,
      technician_trades:technician_trades!technician_id(category:ticket_categories(name))
    `)
    .eq("role", "technician")
    .eq("is_active", true)
    .order("full_name")
    .returns<TechRow[]>();

  const technicians: TechOption[] = (techRows ?? []).map((t) => ({
    id: t.id,
    full_name: t.full_name,
    trades: (t.technician_trades ?? [])
      .map((tt) => tt.category?.name)
      .filter(Boolean) as string[],
  }));

  return (
    <AppShell profile={profile}>
      <TicketRealtime ticketId={ticket.id} />
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to queue
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
          <Section title="Assignment">
            <AssignTechnicianForm
              ticketId={ticket.id}
              technicians={technicians}
              currentAssignee={ticket.assigned_to}
              ticketCategoryName={ticket.category?.name ?? null}
            />
            {ticket.assignee && (
              <p className="text-xs text-slate-500 mt-2">
                Currently assigned: <span className="font-medium">{ticket.assignee.full_name}</span>
              </p>
            )}
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
