import Link from "next/link";
import Image from "next/image";
import { PublicShell } from "@/components/PublicShell";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { CategoryPill } from "@/components/CategoryPill";
import { TicketTimeline } from "@/components/TicketTimeline";
import { getTicketByToken, getFeedbackByTicketId } from "@/lib/track-data";
import { AnonFeedbackForm } from "@/components/AnonFeedbackForm";
import { Star } from "lucide-react";
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
  const existingFeedback = ticket.raised_by === null ? await getFeedbackByTicketId(ticket.id) : null;

  // Build actors map from history changed_by values — for anonymous views we don't
  // expose profile names, so we just show "Team" for any staff action.
  const actors: Record<string, string> = {};
  for (const h of history) {
    if (h.changed_by) actors[h.changed_by] = "Team";
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

        {/* Light-blue anonymous info card */}
        <div className="bg-info-blue rounded-3xl p-5">
          <dl className="grid grid-cols-2 gap-y-3 text-sm text-slate-800">
            {ticket.requester_name && <><dt className="font-medium">Name</dt><dd className="text-slate-700">{ticket.requester_name}</dd></>}
            <dt className="font-medium">Date</dt>
            <dd className="text-slate-700">{new Date(ticket.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "numeric", year: "numeric" })}</dd>
            {ticket.client && <><dt className="font-medium">Building</dt><dd className="text-slate-700">{ticket.client.name}</dd></>}
          </dl>
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
          {ticket.scheduled_at && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-3 inline-flex items-center gap-1.5">
              <span aria-hidden>📅</span>
              Scheduled for{" "}
              <span className="font-medium">
                {new Date(ticket.scheduled_at).toLocaleString("en-SG", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-card">
          <h2 className="text-sm font-medium text-slate-500 mb-3">Timeline</h2>
          <TicketTimeline history={history} actors={actors} />
        </section>

        {(ticket.status === "resolved" || ticket.status === "closed") && ticket.raised_by === null && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-card">
            <h2 className="text-sm font-medium text-slate-500 mb-3">Rate this service</h2>
            {existingFeedback ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((v) => (
                    <Star key={v} className={"w-5 h-5 " + (v <= existingFeedback.rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-slate-800">{existingFeedback.rating} / 5</span>
                  {existingFeedback.would_recommend === true && (
                    <span className="ml-3 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Recommends</span>
                  )}
                  {existingFeedback.would_recommend === false && (
                    <span className="ml-3 inline-flex items-center rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Would not recommend</span>
                  )}
                </div>
                {existingFeedback.comment && (
                  <blockquote className="border-l-4 border-brand-blue pl-3 text-sm text-slate-700 italic">
                    &ldquo;{existingFeedback.comment}&rdquo;
                  </blockquote>
                )}
                <div className="text-xs text-slate-500">
                  Submitted {new Date(existingFeedback.created_at).toLocaleString("en-SG")}
                </div>
              </div>
            ) : (
              <AnonFeedbackForm token={ticket.tracking_token!} />
            )}
          </section>
        )}

        <p className="text-xs text-slate-500 text-center mt-4">
          Reload this page any time to see the latest status. Save this URL to come back easily.
        </p>
      </div>
    </PublicShell>
  );
}
