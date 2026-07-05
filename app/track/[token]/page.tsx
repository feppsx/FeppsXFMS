import Link from "next/link";
import Image from "next/image";
import { PublicShell } from "@/components/PublicShell";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { CategoryPill } from "@/components/CategoryPill";
import { TicketTimeline } from "@/components/TicketTimeline";
import { getTicketByToken } from "@/lib/track-data";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrackTicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const normalized = token.trim().toUpperCase();
  const bundle = await getTicketByToken(normalized);

  if (!bundle) {
    return (
      <PublicShell showTrackLink={false}>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-card max-w-md mx-auto">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Code not found</h1>
          <p className="text-sm text-slate-600 mt-1 mb-4">
            No ticket matches <span className="font-mono">{normalized}</span>. Check for typos and try again.
          </p>
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Try another code
          </Link>
        </div>
      </PublicShell>
    );
  }

  const { ticket, history, attachments } = bundle;

  // Build actors map from history changed_by values — for anonymous views we don't
  // expose profile names, so we just show "Team" for any staff action.
  const actors: Record<string, string> = {};
  for (const h of history) {
    if (h.changed_by) actors[h.changed_by] = "360 Team";
  }

  return (
    <PublicShell showTrackLink={false}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{ticket.tracking_token}</span>
            <span>·</span>
            <span>{new Date(ticket.created_at).toLocaleString("en-SG")}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">{ticket.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.category && <CategoryPill name={ticket.category.name} color={ticket.category.color} />}
          </div>
          <div className="text-sm text-slate-600 mt-2">
            {ticket.client && `${ticket.client.name} · ${ticket.client.location}`}
            {ticket.tenant && ` · ${ticket.tenant.name}`}
            {ticket.specific_area && ` · ${ticket.specific_area}`}
          </div>
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-card">
          <h2 className="text-sm font-medium text-slate-500 mb-2">Your description</h2>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{ticket.description}</p>
        </section>

        {attachments.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-card">
            <h2 className="text-sm font-medium text-slate-500 mb-3">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {attachments.map((a) => a.signed_url ? (
                <a
                  key={a.id}
                  href={a.signed_url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-square rounded-lg overflow-hidden border border-slate-200"
                >
                  <Image
                    src={a.signed_url}
                    alt={a.file_name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                </a>
              ) : null)}
            </div>
          </section>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-card">
          <h2 className="text-sm font-medium text-slate-500 mb-3">Assigned to</h2>
          <p className="text-sm text-slate-800">
            {ticket.assignee?.full_name ?? (
              <span className="text-slate-500">Waiting for the team to pick this up…</span>
            )}
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-card">
          <h2 className="text-sm font-medium text-slate-500 mb-3">Timeline</h2>
          <TicketTimeline history={history} actors={actors} />
        </section>

        <p className="text-xs text-slate-500 text-center mt-4">
          Reload this page any time to see the latest status. Save this URL to come back easily.
        </p>
      </div>
    </PublicShell>
  );
}
