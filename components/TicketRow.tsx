import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { Ticket, TicketCategory, Client, ClientTenant } from "@/lib/db-types";

export interface TicketRowData extends Ticket {
  category?: Pick<TicketCategory, "name"> | null;
  client?:   Pick<Client, "name" | "location"> | null;
  tenant?:   Pick<ClientTenant, "name"> | null;
}

function fmtWhen(iso: string) {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
}

function locationLine(t: TicketRowData) {
  const parts: string[] = [];
  if (t.client) parts.push(`${t.client.name} · ${t.client.location}`);
  if (t.tenant) parts.push(t.tenant.name);
  if (t.specific_area) parts.push(t.specific_area);
  if (t.category?.name) parts.push(t.category.name);
  return parts.join(" · ") || "—";
}

export function TicketRow({ ticket, hrefBase }: { ticket: TicketRowData; hrefBase: string }) {
  return (
    <Link
      href={`${hrefBase}/${ticket.id}`}
      className="block bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-brand hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{ticket.ticket_number}</span>
            <span>·</span>
            <span>{fmtWhen(ticket.created_at)}</span>
          </div>
          <div className="mt-0.5 font-medium text-slate-900 truncate">{ticket.title}</div>
          <div className="mt-0.5 text-xs text-slate-500 truncate">{locationLine(ticket)}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>
    </Link>
  );
}
