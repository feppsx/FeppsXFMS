import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { InvoicePaidToggle } from "@/components/InvoicePaidToggle";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { Invoice } from "@/lib/db-types";
import { Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

interface InvoiceRow extends Invoice {
  ticket: { id: string; ticket_number: string; title: string } | null;
}

interface SP {
  paid?: string;   // "yes" | "no" | undefined = all
  from?: string;   // yyyy-mm-dd
  to?: string;
}

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const FILTERS = [
  { key: "all",    label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid",   label: "Paid" },
];

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const profile = await requireProfile(["admin"]);
  const sp = await searchParams;
  const paidFilter = sp.paid ?? "all";

  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("*, ticket:tickets(id, ticket_number, title)")
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (paidFilter === "paid")   query = query.eq("is_paid", true);
  if (paidFilter === "unpaid") query = query.eq("is_paid", false);
  if (sp.from) query = query.gte("invoice_date", sp.from);
  if (sp.to)   query = query.lte("invoice_date", sp.to);

  const { data: invoices } = await query.limit(500).returns<InvoiceRow[]>();
  const rows = invoices ?? [];

  const totals = rows.reduce(
    (acc, r) => {
      acc.count++;
      acc.sum += Number(r.grand_total || 0);
      if (r.is_paid) acc.paidSum += Number(r.grand_total || 0);
      else           acc.unpaidSum += Number(r.grand_total || 0);
      return acc;
    },
    { count: 0, sum: 0, paidSum: 0, unpaidSum: 0 }
  );

  return (
    <AppShell profile={profile}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold inline-flex items-center gap-2">
          <Receipt className="w-5 h-5 text-brand" />
          Invoices
        </h1>
        <div className="text-xs text-slate-500">{totals.count} shown</div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/invoices${f.key === "all" ? "" : `?paid=${f.key === "paid" ? "yes" : "no"}`}`}
            className={
              (f.key === "all" ? paidFilter === "all" :
               f.key === "paid" ? paidFilter === "yes" :
               paidFilter === "no")
                ? "text-sm rounded-full bg-brand text-white px-3 py-1"
                : "text-sm rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1"
            }
          >
            {f.label}
          </Link>
        ))}
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
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          No invoices in this filter.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">{r.receipt_no}</span>
                  <span>·</span>
                  <span>{r.invoice_date}</span>
                </div>
                <div className="font-medium text-slate-900 truncate mt-0.5">{r.customer_name}</div>
                {r.ticket && (
                  <Link
                    href={`/admin/tickets/${r.ticket.id}`}
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
          ))}
        </div>
      )}
    </AppShell>
  );
}
