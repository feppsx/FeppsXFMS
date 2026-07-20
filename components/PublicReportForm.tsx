"use client";

// Public anonymous report form. Same shape as NewTicketForm but with a
// contact block at the top and a T&C checkbox above submit.
// On success, swaps to a confirmation card showing the tracking token.

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { createAnonymousTicket } from "@/lib/actions/public-report";
import { ReportConfirmation } from "./ReportConfirmation";
import type { Client, ClientTenant, TicketCategory } from "@/lib/db-types";
import { Camera, X, Loader2, Send } from "lucide-react";

interface UploadedPhoto { path: string; name: string; previewUrl: string }

export function PublicReportForm({
  clients, tenants, categories,
}: {
  clients: Pick<Client, "id" | "name" | "location">[];
  tenants: Pick<ClientTenant, "id" | "name" | "client_id">[];
  categories: Pick<TicketCategory, "id" | "name">[];
}) {
  // Form state
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [title, setTitle]     = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [tenantId, setTenantId] = useState<string>("");
  const [specificArea, setSpecificArea] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [terms, setTerms] = useState(false);

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);

  const tenantsForClient = useMemo(
    () => tenants.filter((t) => t.client_id === clientId),
    [tenants, clientId]
  );

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    const supabase = createClient();

    const uploaded: UploadedPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { setUploadError(`Skipped ${file.name} — not an image.`); continue; }
      if (file.size > 10 * 1024 * 1024) { setUploadError(`Skipped ${file.name} — over 10 MB.`); continue; }
      const ext = file.name.split(".").pop() || "jpg";
      const rand = crypto.randomUUID();
      const path = `tickets/new/${rand}.${ext}`;
      const { error } = await supabase.storage
        .from("ticket-attachments")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { setUploadError(`Upload failed for ${file.name}: ${error.message}`); continue; }
      uploaded.push({ path, name: file.name, previewUrl: URL.createObjectURL(file) });
    }
    setPhotos((p) => [...p, ...uploaded]);
    setUploading(false);
  }

  async function removePhoto(idx: number) {
    const target = photos[idx];
    if (!target) return;
    const supabase = createClient();
    await supabase.storage.from("ticket-attachments").remove([target.path]).catch(() => {});
    URL.revokeObjectURL(target.previewUrl);
    setPhotos((p) => p.filter((_, i) => i !== idx));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!terms) return setFormError("Please accept the terms to continue.");

    startTransition(async () => {
      const res = await createAnonymousTicket({
        name, email, phone,
        title, description,
        client_id: clientId,
        tenant_id: tenantId || null,
        category_id: categoryId || null,
        priority,
        specific_area: specificArea || null,
        unit_number: unitNumber || null,
        terms_accepted: terms,
        photos: photos.map((p) => ({ path: p.path, name: p.name })),
      });
      if (res.error) { setFormError(res.error); return; }
      if (res.token) setConfirmedToken(res.token);
    });
  }

  if (confirmedToken) return <ReportConfirmation token={confirmedToken} />;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 shadow-card">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Report an issue</h1>
      <p className="text-sm text-slate-600 mb-6">
        Fill this in and 360 Integrated will look into it. No account needed.
      </p>

      <form onSubmit={submit} className="space-y-5">
        {/* Contact */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Your details</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full name" required value={name} onChange={setName} autoComplete="name" />
            <Field label="Email" required type="email" value={email} onChange={setEmail} autoComplete="email" />
          </div>
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="Optional" autoComplete="tel" />
        </section>

        <hr className="border-slate-200" />

        {/* Issue */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Issue details</h2>

          <Field
            label="Short title"
            required
            value={title}
            onChange={setTitle}
            placeholder="e.g. 4th floor west wing lights not working"
          />

          <div>
            <label className="block text-sm font-medium mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              required value={clientId}
              onChange={(e) => { setClientId(e.target.value); setTenantId(""); }}
              className="w-full rounded-full bg-input-bg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="" disabled>Select a location…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.location}</option>
              ))}
            </select>
          </div>

          {tenantsForClient.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Company (Tenant) <span className="text-red-500">*</span>
              </label>
              <select
                required value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full rounded-full bg-input-bg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="" disabled>Select your company…</option>
                {tenantsForClient.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <Field
            label="Specific area"
            value={specificArea}
            onChange={setSpecificArea}
            placeholder="e.g. 4th floor B wing, near lift lobby"
          />

          <Field
            label="Unit number (optional)"
            value={unitNumber}
            onChange={setUnitNumber}
            placeholder="e.g. #06-11, Blk 71-A"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-full bg-input-bg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Unspecified</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-full bg-input-bg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Describe the problem <span className="text-red-500">*</span>
            </label>
            <textarea
              required rows={4}
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What's wrong, when did you notice it, any impact on operations…"
              className="w-full rounded-full bg-input-bg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium mb-1">Photos</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {photos.map((p, i) => (
                <div key={p.path} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                  <Image src={p.previewUrl} alt={p.name} fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
                    aria-label="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-brand flex flex-col items-center justify-center text-slate-500 text-xs cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-1" />
                    Add photo
                  </>
                )}
                <input
                  type="file" accept="image/*" capture="environment" multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                  disabled={uploading}
                />
              </label>
            </div>
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* T&C */}
        <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          <span>
            I consent to 360 Integrated using my contact details solely to reach me if
            clarification about the issue location is required.
          </span>
        </label>

        {formError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || uploading || !terms}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white font-medium rounded-lg px-5 py-3 text-base disabled:opacity-60 shadow-card"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          Submit ticket
        </button>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, required, placeholder, type = "text", autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full bg-input-bg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
      />
    </div>
  );
}
