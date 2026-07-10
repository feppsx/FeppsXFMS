"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createQuotation } from "@/lib/actions/quotations";
import type { Estate, EstateCategory } from "@/lib/db-types";
import { Loader2, Plus, Trash2, FileText } from "lucide-react";
import { QuotationDownloadButton } from "./QuotationDownloadButton";
import type { QuotationPdfInput } from "./QuotationPDF";

const CATEGORIES: EstateCategory[] = ["Retail", "MCST", "SBS"];

interface Row { key: string; description: string; unit_price: number }

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface QuotationPrefill {
  customer_name?: string;
  customer_address?: string;
  contact_no?: string;
  client_id?: string;
  category?: EstateCategory;
}

export function QuotationForm({
  estates,
  prefill,
}: {
  estates: Pick<Estate, "id" | "name" | "location" | "category" | "address" | "contact_phone">[];
  prefill?: QuotationPrefill;
}) {
  const [customerName, setCustomerName] = useState(prefill?.customer_name ?? "");
  const [customerAddress, setCustomerAddress] = useState(prefill?.customer_address ?? "");
  const [contactNo, setContactNo] = useState(prefill?.contact_no ?? "");
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [estateId, setEstateId] = useState(prefill?.client_id ?? "");
  const [category, setCategory] = useState<EstateCategory>(prefill?.category ?? "MCST");
  const [rows, setRows] = useState<Row[]>([
    { key: crypto.randomUUID(), description: "", unit_price: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<QuotationPdfInput | null>(null);

  const subtotal = useMemo(
    () => rows.reduce((s, r) => s + (isFinite(r.unit_price) ? r.unit_price : 0), 0),
    [rows]
  );
  const grandTotal = Math.max(0, subtotal - discount + gst);

  function pickEstate(id: string) {
    setEstateId(id);
    const e = estates.find((x) => x.id === id);
    if (!e) return;
    setCategory(e.category as EstateCategory);
    if (!customerName) setCustomerName(e.name);
    if (!customerAddress) setCustomerAddress([e.address, e.location].filter(Boolean).join(", "));
    if (!contactNo && e.contact_phone) setContactNo(e.contact_phone);
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setRows((r) => [...r, { key: crypto.randomUUID(), description: "", unit_price: 0 }]);
  }
  function removeRow(key: string) {
    setRows((r) => (r.length <= 1 ? r : r.filter((row) => row.key !== key)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createQuotation({
        client_id: estateId || null,
        category,
        customer_name: customerName,
        customer_address: customerAddress,
        contact_no: contactNo,
        quotation_date: quotationDate,
        valid_until: validUntil || null,
        discount,
        gst_amount: gst,
        notes,
        items: rows.map((r) => ({ description: r.description, unit_price: r.unit_price })),
      });
      if (res.error) { setError(res.error); toast.error(res.error); return; }
      toast.success(`Quotation ${res.quotation_no} saved`);
      setSaved({
        quotation_no: res.quotation_no!,
        quotation_date: quotationDate,
        valid_until: validUntil || null,
        customer_name: customerName,
        customer_address: customerAddress || null,
        contact_no: contactNo || null,
        subtotal, discount, gst_amount: gst, grand_total: grandTotal,
        notes: notes || null,
        items: rows.filter((r) => r.description.trim()).map((r) => ({ description: r.description, unit_price: r.unit_price })),
      });
    });
  }

  if (saved) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-brand mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900">Quotation saved</h2>
        <p className="text-sm text-slate-600 mt-1"><span className="font-mono font-semibold">{saved.quotation_no}</span></p>
        <div className="mt-4 flex justify-center gap-2">
          <QuotationDownloadButton q={saved} />
          <button type="button"
            onClick={() => { setSaved(null); setRows([{ key: crypto.randomUUID(), description: "", unit_price: 0 }]); }}
            className="inline-flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50">
            New quotation
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Estate (optional)</label>
          <select value={estateId} onChange={(e) => pickEstate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
            <option value="">— Pick estate to auto-fill —</option>
            {estates.map((e) => (<option key={e.id} value={e.id}>{e.name} · {e.location}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as EstateCategory)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Customer name *</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Contact number</label>
          <input value={contactNo} onChange={(e) => setContactNo(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
        <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Quotation date</label>
          <input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Valid until</label>
          <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-800">Line items</h3>
          <button type="button" onClick={addRow} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add row
          </button>
        </div>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-12 gap-2">
              <input value={row.description} onChange={(e) => updateRow(row.key, { description: e.target.value })} placeholder="Description" className="col-span-8 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input type="number" step="0.01" min="0" value={row.unit_price || ""} onChange={(e) => updateRow(row.key, { unit_price: parseFloat(e.target.value) || 0 })} placeholder="0.00" className="col-span-3 rounded-lg border border-slate-300 px-3 py-2 text-sm text-right" />
              <button type="button" onClick={() => removeRow(row.key)} className="col-span-1 rounded-lg border border-slate-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600" disabled={rows.length <= 1}>
                <Trash2 className="w-4 h-4 mx-auto" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">S$ {money(subtotal)}</span></div>
        <div className="flex justify-between items-center">
          <span>Discount</span>
          <input type="number" step="0.01" min="0" value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0.00" className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-right font-mono" />
        </div>
        <div className="flex justify-between items-center">
          <span>GST</span>
          <input type="number" step="0.01" min="0" value={gst || ""} onChange={(e) => setGst(parseFloat(e.target.value) || 0)} placeholder="0.00" className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-right font-mono" />
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-base">
          <span>Grand total</span><span className="font-mono">S$ {money(grandTotal)}</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Save quotation
      </button>
    </form>
  );
}
