// Presentational + query component for admin invoice list.
// Called from /admin/invoices (all) and the three category sub-pages.

import Link from "next/link";
import { InvoicePaidToggle } from "@/components/InvoicePaidToggle";
import { EmptyState } from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/server";
import type { Invoice, EstateCategory } from "@/lib/db-types";
import { Receipt } from "lucide-react";

interface InvoiceRow extends Invoice {
  ticket: { id: string; ticket_number: string; title: string } | null;
}

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CATEGORY_COLOR: Record<string, string> = {
  Retail: "bg-orange-100 text-orange-700 border-orange-200",
  MCST:   "bg-brand-100  text-brand-700  border-brand-200",
  SBS:    "bg-purple-100 text-purple-700 border-purple-200",
};

const PAID_FILTERS = [
  { key: "all",    label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid",   label: "Paid" },
];

export async function InvoicesListView({
  title, subtitle, backHref,
  paidFilter = "all", forcedCategory, selectableCategory,
  ticketHrefBase = "/admin/tickets",
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  paidFilter?: string;
  /** If set, category is locked; no dropdown. */
  forcedCategory?: EstateCategory | null;
  /** If true, render a category dropdown; ignored when forcedCategory is set. */
  selectableCategory?: {
    current: string;     // "all" | Retail | MCST | SBS
    basePath: string;    // e.g. "/admin/invoices"
    paid: string;
  };
  /** Where "Ticket TKT-…" links point (admin queue vs tech jobs). */
  ticketHrefBase?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("*, ticket:tickets(id, ticket_number, title)")
    .order("invoice_date", { ascending: false })
    .order("created_at",   { ascending: false });

  if (paidFilter === "paid")   query = query.eq("is_paid", true);
  if (paidFilter === "unpaid") query = query.eq("is_paid", false);
  if (forcedCategory)          query = query.eq("category", forcedCategory);
  else if (selectableCategory?.current && selectableCategory.current !== "all") {
    query = query.eq("category", selectableCategory.current);
  }

  const { data: invoices } = await query.limit(500).returns<InvoiceRow[]>();
  const rows = invoices ?? [];

  const totals = rows.reduce(
    (acc, r) => {
      acc.count++;
      const g = Number(r.grand_total || 0);
      acc.sum += g;
      if (r.is_paid) acc.paidSum += g;
      else           acc.unpaidSum += g;
      return acc;
    },
    { count: 0, sum: 0, paidSum: 0, unpaidSum: 0 }
  );

  function paidChipHref(key: string) {
    const params = new URLSearchParams();
    if (key !== "all") params.set("paid", key === "paid" ? "paid" : "unpaid");
    if (selectableCategory?.current && selectableCategory.current !== "all") {
      params.set("category", selectableCategory.current);
    }
    const qs = params.toString();
    const base = selectableCategory?.basePath ?? "/admin/invoices";
    return qs ? `${base}?${qs}` : base;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold inline-flex items-center gap-2">
          <Receipt className="w-5 h-5 text-brand" />
          {title}
        </h1>
        <div className="text-xs text-slate-500">{totals.count} shown</div>
      </div>
      {subtitle && <p className="text-sm text-slate-500 mb-4">{subtitle}</p>}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {PAID_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={paidChipHref(f.key)}
            className={
              (f.key === "all" ? paidFilter === "all" :
               f.key === "paid" ? paidFilter === "paid" :
               paidFilter === "unpaid")
                ? "text-sm rounded-full bg-brand text-white px-3 py-1"
                : "text-sm rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1"
            }
          >
            {f.label}
          </Link>
        ))}

        {selectableCategory && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Category:</span>
            <CategoryLinkGroup
              current={selectableCategory.current}
              basePath={selectableCategory.basePath}
              paid={selectableCategory.paid}
            />
          </div>
        )}
      </div>

      {/* Totals band */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
          <div className="text-xs text-slate-500">Total billed</div>
          <div className="text-lg font-semibold">S$ {money(totals.sum)}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
          <div className="text-xs text-emerald-700">Paid</div>
          <div className="text-lg font-semibold text-emerald-800">S$ {money(totals.paidSum)}</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3">
          <div className="text-xs text-rose-700">Unpaid</div>
          <div className="text-lg font-semibold text-rose-800">S$ {money(totals.unpaidSum)}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          variant="invoices"
          title="No invoices in this view"
          message="Try clearing filters, or pick another category."
        />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const cat = r.category ? CATEGORY_COLOR[r.category] : null;
            return (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono">{r.receipt_no}</span>
                    <span>·</span>
                    <span>{r.invoice_date}</span>
                    {r.category && cat && (
                      <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " + cat}>
                        {r.category}
                      </span>
                    )}
                    {!r.ticket_id && (
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 text-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        Manual
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-slate-900 truncate mt-0.5">{r.customer_name}</div>
                  {r.ticket && (
                    <Link
                      href={`${ticketHrefBase}/${r.ticket.id}`}
                      className="text-xs text-slate-500 hover:text-brand truncate block"
                    >
                      Ticket <span className="font-mono">{r.ticket.ticket_number}</span> — {r.ticket.title}
                    </Link>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="font-semibold text-sm">S$ {money(Number(r.grand_total))}</div>
                  <InvoicePaidToggle invoiceId={r.id} isPaid={r.is_paid} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {backHref && (
        <div className="mt-4">
          <Link href={backHref} className="text-sm text-brand hover:underline">
            ← Back to all invoices
          </Link>
        </div>
      )}
    </div>
  );
}

function CategoryLinkGroup({
  current, basePath, paid,
}: {
  current: string; basePath: string; paid: string;
}) {
  const items = ["all", "Retail", "MCST", "SBS"];
  return (
    <div className="flex items-center gap-1">
      {items.map((c) => {
        const params = new URLSearchParams();
        if (paid !== "all") params.set("paid", paid);
        if (c !== "all")    params.set("category", c);
        const qs = params.toString();
        const href = qs ? `${basePath}?${qs}` : basePath;
        const active = current === c;
        return (
          <Link
            key={c}
            href={href}
            className={
              active
                ? "text-xs rounded-md bg-brand text-white px-2 py-1"
                : "text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 px-2 py-1"
            }
          >
            {c === "all" ? "All" : c}
          </Link>
        );
      })}
    </div>
  );
}
