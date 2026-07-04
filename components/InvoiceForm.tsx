"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvoice, type InvoiceItemInput } from "@/lib/actions/invoices";
import { Loader2, Plus, Trash2, Receipt, ChevronDown, ChevronUp } from "lucide-react";

interface Prefill {
  customer_name: string;
  customer_address: string;
  contact_no: string;
  time_in: string;
  time_out: string;
}

interface Row extends InvoiceItemInput { key: string }

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoiceForm({
  ticketId,
  prefill,
  onSaved,
}: {
  ticketId: string;
  prefill: Prefill;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [customerName,    setCustomerName]    = useState(prefill.customer_name);
  const [customerAddress, setCustomerAddress] = useState(prefill.customer_address);
  const [contactNo,       setContactNo]       = useState(prefill.contact_no);
  const [timeIn,          setTimeIn]          = useState(prefill.time_in);
  const [timeOut,         setTimeOut]         = useState(prefill.time_out);

  const [rows, setRows] = useState<Row[]>([
    { key: crypto.randomUUID(), description: "", unit_price: 0 },
  ]);

  const [discount, setDiscount] = useState(0);
  const [gst,      setGst]      = useState(0);
  const [deposit,  setDeposit]  = useState(0);
  const [showExtras, setShowExtras] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const subtotal = useMemo(
    () => rows.reduce((s, r) => s + (isFinite(r.unit_price) ? r.unit_price : 0), 0),
    [rows]
  );
  const grandTotal = Math.max(0, subtotal - discount + gst - deposit);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setRows((r) => [...r, { key: crypto.randomUUID(), description: "", unit_price: 0 }]);
  }
  function removeRow(key: string) {
    setRows((r) => (r.length <= 1 ? r : r.filter((row) => row.key !== key)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const items = rows
      .map((r) => ({ description: r.description.trim(), unit_price: Number(r.unit_price) || 0 }))
      .filter((r) => r.description.length > 0);
    if (items.length === 0) return setError("Add at least one line item.");
    if (!customerName.trim()) return setError("Customer name is required.");

    startTransition(async () => {
      const res = await createInvoice({
        ticket_id: ticketId,
        customer_name: customerName,
        customer_address: customerAddress,
        contact_no: contactNo,
        time_in: timeIn,
        time_out: timeOut,
        discount, gst_amount: gst, deposit_amount: deposit,
        items,
      });
      if (res.error) { setError(res.error); return; }
      onSaved();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* customer */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Customer M/s" value={customerName}    onChange={setCustomerName} required />
        <Field label="Contact No"   value={contactNo}       onChange={setContactNo} />
        <Field label="Address"      value={customerAddress} onChange={setCustomerAddress} className="sm:col-span-2" />
        <Field label="Time In"      value={timeIn}          onChange={setTimeIn}  placeholder="e.g. 09:30" />
        <Field label="Time Out"     value={timeOut}         onChange={setTimeOut} placeholder="e.g. 11:15" />
      </div>

      {/* line items */}
      <div>
        <div className="text-sm font-medium mb-2">Line items</div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.key} className="flex items-start gap-2">
              <div className="text-xs text-slate-400 pt-2 w-6 text-right">{i + 1}.</div>
              <div className="flex-1">
                <input
                  type="text"
                  value={r.description}
                  onChange={(e) => updateRow(r.key, { description: e.target.value })}
                  placeholder="Description of work / part supplied"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="w-32">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">S$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={r.unit_price || ""}
                    onChange={(e) => updateRow(r.key, { unit_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRow(r.key)}
                disabled={rows.length <= 1}
                className="mt-1 p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30"
                title="Remove row"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add row
        </button>
      </div>

      {/* extras */}
      <div>
        <button
          type="button"
          onClick={() => setShowExtras((v) => !v)}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
        >
          {showExtras ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showExtras ? "Hide" : "Add"} Discount / GST / Deposit
        </button>
        {showExtras && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <NumField label="Discount" value={discount} onChange={setDiscount} />
            <NumField label="GST"      value={gst}      onChange={setGst} />
            <NumField label="Deposit"  value={deposit}  onChange={setDeposit} />
          </div>
        )}
      </div>

      {/* totals */}
      <div className="border-t border-slate-200 pt-3 space-y-1 text-sm">
        <TotalLine label="Sub-total" value={subtotal} />
        {discount > 0 && <TotalLine label="Discount" value={-discount} muted />}
        {gst > 0      && <TotalLine label="GST"      value={gst} muted />}
        {deposit > 0  && <TotalLine label="Deposit"  value={-deposit} muted />}
        <div className="flex items-center justify-between font-semibold text-base pt-1 border-t border-slate-200">
          <span>Grand Total</span>
          <span>S$ {money(grandTotal)}</span>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-medium rounded-lg px-5 py-2.5 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
          Save invoice
        </button>
      </div>
    </form>
  );
}

function Field({
  label, value, onChange, required, placeholder, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}

function NumField({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-2 text-slate-400 text-sm">S$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="w-full rounded-lg border border-slate-300 pl-9 pr-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
    </div>
  );
}

function TotalLine({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={"flex items-center justify-between " + (muted ? "text-slate-500" : "")}>
      <span>{label}</span>
      <span>S$ {money(value)}</span>
    </div>
  );
}
