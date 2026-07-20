// Light-blue compact info table shown at the top of tech / admin job detail
// pages on MOBILE. Matches the mockup: rounded corners, subtle blue background,
// two-column key/value grid.

import type { TicketWithRelations } from "@/lib/ticket-data";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-SG", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export function TicketInfoTable({ ticket }: { ticket: TicketWithRelations }) {
  const name = ticket.raiser?.full_name ?? ticket.requester_name ?? "—";
  const contact = ticket.requester_phone ?? "—";
  const unit = ticket.unit_number ?? ticket.specific_area ?? "—";

  const rows: [string, string][] = [
    ["Name",    name],
    ["Contact", contact],
    ["Unit Number", unit],
    ["Date",    fmtDate(ticket.created_at)],
    ["Time",    fmtTime(ticket.created_at)],
  ];

  return (
    <div className="bg-info-blue rounded-3xl p-5">
      <div className="text-xs text-brand-blue font-semibold mb-3">
        TICKET ID : <span className="text-slate-900 font-mono ml-1">{ticket.ticket_number}</span>
      </div>
      <div className="text-lg font-semibold text-slate-900 mb-4">{ticket.title}</div>
      <dl className="grid grid-cols-2 gap-y-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-700">{k}</dt>
            <dd className="text-slate-900 font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
