import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import type { EstateCardData } from "@/lib/estate-data";

const CATEGORY_COLOR: Record<string, string> = {
  Retail: "bg-orange-100 text-orange-700 border-orange-200",
  MCST:   "bg-brand-100  text-brand-700  border-brand-200",
  SBS:    "bg-purple-100 text-purple-700 border-purple-200",
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "Asia/Singapore",
  };
  return d.toLocaleString("en-SG", opts);
}

export function EstateCard({
  data, hrefBase = "/admin/clients",
}: {
  data: EstateCardData;
  hrefBase?: string;
}) {
  const catCls = CATEGORY_COLOR[data.category] ?? "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <Link
      href={`${hrefBase}/${data.id}/tickets`}
      className="card-lift block bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-brand transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 truncate">{data.name}</span>
              <span
                className={
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
                  catCls
                }
              >
                {data.category}
              </span>
            </div>
            <div className="text-xs text-slate-500 truncate mt-0.5">{data.location}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {data.open_count > 0
                ? `${data.open_count} open`
                : "No open tickets"}
              {data.newest_ticket_at && (
                <>
                  <span className="mx-1">·</span>
                  <span>Latest {timeAgo(data.newest_ticket_at)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {data.new_count > 0 && (
            <span
              className="urgent-pulse inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold min-w-[24px] h-6 px-1.5"
              title={`${data.new_count} new ticket${data.new_count === 1 ? "" : "s"} waiting for triage`}
            >
              {data.new_count}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </Link>
  );
}
