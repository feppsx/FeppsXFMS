"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  createManualInvoice, updateManualInvoice, type InvoiceItemInput,
} from "@/lib/actions/invoices";
import { ManualInvoiceConfirmation } from "./ManualInvoiceConfirmation";
import type { CompanyBranding } from "@/lib/company-settings-data";
import type {
  Estate, Invoice, InvoiceItem, EstateCategory,
} from "@/lib/db-types";
import {
  Loader2, Plus, Trash2, Receipt, ChevronDown, ChevronUp,
  Camera, X,
} from "lucide-react";

const CATEGORIES: EstateCategory[] = ["Retail", "MCST", "SBS"];

interface Row extends InvoiceItemInput { key: string }
interface UploadedPhoto { path: string; name: string; previewUrl: string }

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ManualInvoiceForm({
  estates,
  branding,
}: {
  estates: Pick<Estate, "id" | "name" | "location" | "category" | "address" | "contact_phone">[];
  branding?: CompanyBranding | null;
}) {
  // Customer + meta
  const [customerName,    setCustomerName]    = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [contactNo,       setContactNo]       = useState("");
  const [invoiceDate,     setInvoiceDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [timeIn,          setTimeIn]          = useState("");
  const [timeOut,         setTimeOut]         = useState("");
  const [notes,           setNotes]           = useState("");

  // Estate + category
  const [estateId, setEstateId] = useState<string>("");
  const [category, setCategory] = useState<EstateCategory>("MCST");

  // Line items
  const [rows, setRows] = useState<Row[]>([
    { key: crypto.randomUUID(), description: "", unit_price: 0 },
  ]);

  // Extras
  const [discount, setDiscount] = useState(0);
  const [gst,      setGst]      = useState(0);
  const [deposit,  setDeposit]  = useState(0);
  const [showExtras, setShowExtras] = useState(false);

  // Photos
  const [beforePhotos, setBeforePhotos] = useState<UploadedPhoto[]>([]);
  const [afterPhotos,  setAfterPhotos]  = useState<UploadedPhoto[]>([]);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter,  setUploadingAfter]  = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<{
    invoice: Invoice; items: InvoiceItem[];
    beforePaths: string[]; afterPaths: string[];
  } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const subtotal   = useMemo(() => rows.reduce((s, r) => s + (isFinite(r.unit_price) ? r.unit_price : 0), 0), [rows]);
  const grandTotal = Math.max(0, subtotal - discount + gst - deposit);

  // -------- Auto-fill customer when an estate is picked --------------------
  function pickEstate(id: string) {
    setEstateId(id);
    const e = estates.find((x) => x.id === id);
    if (!e) return;
    setCategory(e.category as EstateCategory);
    if (!customerName)    setCustomerName(e.name);
    if (!customerAddress) setCustomerAddress([e.address, e.location].filter(Boolean).join(", "));
    if (!contactNo && e.contact_phone) setContactNo(e.contact_phone);
  }

  // -------- Row helpers ----------------------------------------------------
  function updateRow(key: string, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setRows((r) => [...r, { key: crypto.randomUUID(), description: "", unit_price: 0 }]);
  }
  function removeRow(key: string) {
    setRows((r) => (r.length <= 1 ? r : r.filter((row) => row.key !== key)));
  }

  // -------- Photo uploads --------------------------------------------------
  async function handleFiles(files: FileList | null, kind: "before" | "after") {
    if (!files || files.length === 0) return;
    setUploadError(null);
    if (kind === "before") setUploadingBefore(true); else setUploadingAfter(true);

    const supabase = createClient();
    const uploaded: UploadedPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { setUploadError(`Skipped ${file.name} — not an image.`); continue; }
      if (file.size > 10 * 1024 * 1024)   { setUploadError(`Skipped ${file.name} — over 10 MB.`); continue; }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `tickets/manual/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("ticket-attachments")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) { setUploadError(`Upload failed for ${file.name}: ${upErr.message}`); continue; }
      uploaded.push({ path, name: file.name, previewUrl: URL.createObjectURL(file) });
    }
    if (kind === "before") setBeforePhotos((p) => [...p, ...uploaded]);
    else                   setAfterPhotos((p) => [...p, ...uploaded]);
    if (kind === "before") setUploadingBefore(false); else setUploadingAfter(false);
  }

  async function removePhoto(idx: number, kind: "before" | "after") {
    const list = kind === "before" ? beforePhotos : afterPhotos;
    const target = list[idx];
    if (!target) return;
    const supabase = createClient();
    await supabase.storage.from("ticket-attachments").remove([target.path]).catch(() => {});
    URL.revokeObjectURL(target.previewUrl);
    const setter = kind === "before" ? setBeforePhotos : setAfterPhotos;
    setter((p) => p.filter((_, i) => i !== idx));
  }

  // -------- Submit ---------------------------------------------------------
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const items = rows
      .map((r) => ({ description: r.description.trim(), unit_price: Number(r.unit_price) || 0 }))
      .filter((r) => r.description.length > 0);
    if (items.length === 0)      return setError("Add at least one line item.");
    if (!customerName.trim())    return setError("Customer name is required.");

    startTransition(async () => {
      const payload = {
        customer_name:    customerName,
        customer_address: customerAddress || null,
        contact_no:       contactNo || null,
        invoice_date:     invoiceDate,
        time_in:          timeIn || null,
        time_out:         timeOut || null,
        category,
        client_id:        estateId || null,
        discount,
        gst_amount:       gst,
        deposit_amount:   deposit,
        notes:            notes || null,
        items,
        before_photo_paths: beforePhotos.map((p) => p.path),
        after_photo_paths:  afterPhotos.map((p) => p.path),
      };
      const res = savedId
        ? await updateManualInvoice(savedId, payload)
        : await createManualInvoice(payload);
      if (res.error || !res.id) { setError(res.error ?? "Save failed."); return; }

      // Build the Invoice + items objects for the confirmation view.
      const now = new Date().toISOString();
      const invoice: Invoice = {
        id: res.id, receipt_no: res.receipt_no!,
        ticket_id: null, client_id: estateId || null, category,
        created_by: null,
        customer_name: customerName.trim(),
        customer_address: customerAddress || null,
        contact_no: contactNo || null,
        invoice_date: invoiceDate,
        time_in: timeIn || null, time_out: timeOut || null,
        subtotal, discount,
        gst_amount: gst, deposit_amount: deposit,
        grand_total: grandTotal,
        notes: notes || null,
        is_paid: false, paid_at: null, paid_by: null,
        before_photo_paths: beforePhotos.map((p) => p.path),
        after_photo_paths:  afterPhotos.map((p) => p.path),
        created_at: now, updated_at: now,
      };
      const itemRows: InvoiceItem[] = items.map((it, i) => ({
        id: crypto.randomUUID(),
        invoice_id: res.id!,
        description: it.description, unit_price: it.unit_price, sort_order: i,
        created_at: now,
      }));

      setSaved({
        invoice,
        items: itemRows,
        beforePaths: beforePhotos.map((p) => p.path),
        afterPaths:  afterPhotos.map((p) => p.path),
      });
      setSavedId(res.id!);
    });
  }

  if (saved) {
    return (
      <ManualInvoiceConfirmation
        invoice={saved.invoice}
        items={saved.items}
        beforePaths={saved.beforePaths}
        afterPaths={saved.afterPaths}
        onEdit={() => setSaved(null)}
        branding={branding}
      />
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {savedId && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-xs">
          Editing existing invoice. Saving will update the same PDF.
        </div>
      )}
      {/* Estate + category */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Estate</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Estate <span className="text-xs font-normal text-slate-500">(optional)</span></label>
            <select
              value={estateId} onChange={(e) => pickEstate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-sm"
            >
              <option value="">No estate — bill directly</option>
              {estates.map((e) => (
                <option key={e.id} value={e.id}>{e.name} — {e.location}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category <span className="text-red-500">*</span></label>
            <select
              value={category} required
              onChange={(e) => setCategory(e.target.value as EstateCategory)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-sm"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Customer */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Customer</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Customer M/s" value={customerName}    onChange={setCustomerName} required />
          <Field label="Contact No"   value={contactNo}       onChange={setContactNo} />
          <Field label="Address"      value={customerAddress} onChange={setCustomerAddress} className="sm:col-span-2" />
          <div className="grid grid-cols-3 gap-2 sm:col-span-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <Field label="Time In"  value={timeIn}  onChange={setTimeIn}  placeholder="09:30" />
            <Field label="Time Out" value={timeOut} onChange={setTimeOut} placeholder="11:15" />
          </div>
        </div>
      </section>

      {/* Line items */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Line items</h2>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.key} className="flex items-start gap-2">
              <div className="text-xs text-slate-400 pt-2 w-6 text-right">{i + 1}.</div>
              <div className="flex-1">
                <input
                  type="text" value={r.description}
                  onChange={(e) => updateRow(r.key, { description: e.target.value })}
                  placeholder="Description of work / part supplied"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="w-32 relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">S$</span>
                <input
                  type="number" step="0.01" min="0" inputMode="decimal"
                  value={r.unit_price || ""}
                  onChange={(e) => updateRow(r.key, { unit_price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <button
                type="button" onClick={() => removeRow(r.key)}
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
          type="button" onClick={addRow}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add row
        </button>
      </section>

      {/* Extras */}
      <section>
        <button
          type="button" onClick={() => setShowExtras((v) => !v)}
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
      </section>

      {/* Notes */}
      <section>
        <label className="block text-sm font-medium mb-1">Notes <span className="text-xs font-normal text-slate-500">(optional)</span></label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
      </section>

      {/* Photos */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Photo evidence <span className="text-xs font-normal text-slate-500">(optional)</span>
        </h2>
        <p className="text-xs text-slate-500">
          Attach Before / After photos. When you download the PDF, tick &ldquo;Add photo evidence&rdquo;
          to include them as a second page.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <PhotoBlock
            label="Before"
            photos={beforePhotos}
            uploading={uploadingBefore}
            onFiles={(f) => handleFiles(f, "before")}
            onRemove={(i) => removePhoto(i, "before")}
          />
          <PhotoBlock
            label="After"
            photos={afterPhotos}
            uploading={uploadingAfter}
            onFiles={(f) => handleFiles(f, "after")}
            onRemove={(i) => removePhoto(i, "after")}
          />
        </div>

        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </section>

      {/* Totals */}
      <section className="border-t border-slate-200 pt-3 space-y-1 text-sm">
        <TotalLine label="Sub-total" value={subtotal} />
        {discount > 0 && <TotalLine label="Discount" value={-discount} muted />}
        {gst > 0      && <TotalLine label="GST"      value={gst} muted />}
        {deposit > 0  && <TotalLine label="Deposit"  value={-deposit} muted />}
        <div className="flex items-center justify-between font-semibold text-base pt-1 border-t border-slate-200">
          <span>Grand Total</span>
          <span>S$ {money(grandTotal)}</span>
        </div>
      </section>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="pt-1">
        <button
          type="submit" disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-medium rounded-lg px-5 py-3 text-base disabled:opacity-60 shadow-card"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
          {savedId ? "Update invoice" : "Save and Generate"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Small local presentational helpers
// ---------------------------------------------------------------------------
function Field({
  label, value, onChange, required, placeholder, type = "text", className,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type} value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-2 text-slate-400 text-sm">S$</span>
        <input
          type="number" step="0.01" min="0" inputMode="decimal"
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

function PhotoBlock({
  label, photos, uploading, onFiles, onRemove,
}: {
  label: string;
  photos: UploadedPhoto[];
  uploading: boolean;
  onFiles: (files: FileList | null) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-600 mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <div key={p.path} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
            <Image src={p.previewUrl} alt={p.name} fill className="object-cover" unoptimized />
            <button
              type="button" onClick={() => onRemove(i)}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
              aria-label="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-brand flex flex-col items-center justify-center text-slate-500 text-xs cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <>
              <Camera className="w-4 h-4 mb-0.5" />
              Add
            </>
          )}
          <input
            type="file" accept="image/*" capture="environment" multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
