import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { Ticket } from "@/lib/db-types";

export function TicketDetailHeader({
  ticket, client, tenant, category,
}: {
  ticket: Ticket;
  client?: { name: string; location: string } | null;
  tenant?: { name: string } | null;
  category?: { name: string } | null;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-mono">{ticket.ticket_number}</span>
        <span>·</span>
        <span>{new Date(ticket.created_at).toLocaleString("en-SG")}</span>
      </div>
      <h1 className="text-xl font-semibold mt-1">{ticket.title}</h1>
      <div className="flex items-center gap-2 mt-2">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        {category?.name && <span className="text-xs text-slate-500">{category.name}</span>}
      </div>
      <div className="text-sm text-slate-600 mt-2">
        {client ? `${client.name} · ${client.location}` : "—"}
        {tenant ? ` · ${tenant.name}` : ""}
        {ticket.specific_area ? ` · ${ticket.specific_area}` : ""}
      </div>
    </div>
  );
}
