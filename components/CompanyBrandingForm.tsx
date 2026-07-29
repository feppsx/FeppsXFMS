"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateCompanySettings } from "@/lib/actions/company-settings";
import type { CompanyBranding } from "@/lib/company-settings-data";
import { Loader2, Save, Upload, X } from "lucide-react";

export function CompanyBrandingForm({ initial }: { initial: CompanyBranding }) {
  const [companyName, setCompanyName] = useState(initial.company_name);
  const [tagline, setTagline] = useState(initial.tagline ?? "");
  const [uen, setUen] = useState(initial.uen);
  const [gst, setGst] = useState(initial.gst_reg ?? "");
  const [address, setAddress] = useState(initial.address_line ?? "");
  const [phoneOffice, setPhoneOffice] = useState(initial.phone_office ?? "");
  const [phoneHotline, setPhoneHotline] = useState(initial.phone_hotline ?? "");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState(initial.phone_whatsapp ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [badges, setBadges] = useState(initial.badges_line ?? "");
  const [invoiceTerms, setInvoiceTerms] = useState(initial.invoice_terms ?? "");
  const [quotationTerms, setQuotationTerms] = useState(initial.quotation_terms ?? "");
  const [paynow, setPaynow] = useState(initial.paynow_text ?? "");

  const [logoPath, setLogoPath] = useState<string | null>(initial.logo_path);
  const [logoDarkPath, setLogoDarkPath] = useState<string | null>(initial.logo_dark_path);
  const [stampPath, setStampPath] = useState<string | null>(initial.stamp_path);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logo_url);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(initial.logo_dark_url);
  const [stampUrl, setStampUrl] = useState<string | null>(initial.stamp_url);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLogoDark, setUploadingLogoDark] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function upload(file: File, kind: "logo" | "logo_dark" | "stamp") {
    setError(null);
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    if (kind === "logo") setUploadingLogo(true); else if (kind === "logo_dark") setUploadingLogoDark(true); else setUploadingStamp(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `${kind}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("company-assets")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) { setError(upErr.message); if (kind === "logo") setUploadingLogo(false); else if (kind === "logo_dark") setUploadingLogoDark(false); else setUploadingStamp(false); return; }

    const { data: signed } = await supabase.storage.from("company-assets").createSignedUrl(path, 60 * 60);
    if (kind === "logo") { setLogoPath(path); setLogoUrl(signed?.signedUrl ?? null); setUploadingLogo(false); }
    else if (kind === "logo_dark") { setLogoDarkPath(path); setLogoDarkUrl(signed?.signedUrl ?? null); setUploadingLogoDark(false); }
    else { setStampPath(path); setStampUrl(signed?.signedUrl ?? null); setUploadingStamp(false); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateCompanySettings({
        logo_path: logoPath, logo_dark_path: logoDarkPath, stamp_path: stampPath,
        company_name: companyName, tagline, uen, gst_reg: gst,
        address_line: address,
        phone_office: phoneOffice, phone_hotline: phoneHotline, phone_whatsapp: phoneWhatsapp,
        email, website, badges_line: badges,
        invoice_terms: invoiceTerms, quotation_terms: quotationTerms,
        paynow_text: paynow,
      });
      if (res.error) { setError(res.error); toast.error(res.error); return; }
      toast.success("Branding saved. New PDFs will use these settings.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Images */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Images</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <ImageSlot
            label="Company logo (light mode)"
            hint="Used on white backgrounds. PNG with transparent bg, max 5 MB"
            url={logoUrl} uploading={uploadingLogo}
            onFile={(f) => upload(f, "logo")}
            onClear={() => { setLogoPath(null); setLogoUrl(null); }}
          />
          <ImageSlot
            label="Company logo (dark mode)"
            hint="Used on the dark canvas. White or light version of the logo"
            url={logoDarkUrl} uploading={uploadingLogoDark}
            onFile={(f) => upload(f, "logo_dark")}
            onClear={() => { setLogoDarkPath(null); setLogoDarkUrl(null); }}
          />
          <ImageSlot
            label="Company stamp"
            hint="Square PNG with transparent background, max 5 MB"
            url={stampUrl} uploading={uploadingStamp}
            onFile={(f) => upload(f, "stamp")}
            onClear={() => { setStampPath(null); setStampUrl(null); }}
          />
        </div>
      </section>

      {/* Company header text */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Header text</h2>
        <Field label="Company name" required value={companyName} onChange={setCompanyName} />
        <Field label="Tagline" value={tagline} onChange={setTagline} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="UEN" required value={uen} onChange={setUen} />
          <Field label="GST registration" value={gst} onChange={setGst} />
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Contact</h2>
        <Field label="Address (single line)" value={address} onChange={setAddress} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Phone (office)" value={phoneOffice} onChange={setPhoneOffice} />
          <Field label="Phone (hotline)" value={phoneHotline} onChange={setPhoneHotline} />
          <Field label="Phone (WhatsApp)" value={phoneWhatsapp} onChange={setPhoneWhatsapp} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Email" value={email} onChange={setEmail} />
          <Field label="Website" value={website} onChange={setWebsite} />
        </div>
        <Field label="Certification badges line" value={badges} onChange={setBadges} />
      </section>

      {/* Payment + terms */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Payment & Terms</h2>
        <Field label="PayNow footer text" value={paynow} onChange={setPaynow} />
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Terms & Conditions (one bullet per line)</label>
          <textarea value={invoiceTerms} onChange={(e) => setInvoiceTerms(e.target.value)} rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Quotation Terms & Conditions (one bullet per line)</label>
          <textarea value={quotationTerms} onChange={(e) => setQuotationTerms(e.target.value)} rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono" />
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending}
        className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-full px-8 py-3 text-sm font-semibold disabled:opacity-60">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save branding
      </button>
    </form>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input value={value} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </div>
  );
}

function ImageSlot({
  label, hint, url, uploading, onFile, onClear,
}: {
  label: string;
  hint?: string;
  url: string | null;
  uploading: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-3">
      <div className="text-xs font-medium text-slate-700 mb-2">{label}</div>
      <div className="aspect-[3/2] bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden mb-2">
        {url ? (
          <div className="relative w-full h-full">
            <Image src={url} alt={label} fill className="object-contain" unoptimized />
          </div>
        ) : uploading ? (
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        ) : (
          <div className="text-slate-400 text-xs">No image</div>
        )}
      </div>
      <div className="flex gap-2">
        <label className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-full px-3 py-2 text-xs font-medium cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          {url ? "Replace" : "Upload"}
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
        {url && (
          <button type="button" onClick={onClear}
            className="inline-flex items-center gap-1.5 border border-slate-300 rounded-full px-3 py-2 text-xs font-medium hover:bg-slate-50">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-slate-500 mt-2">{hint}</p>}
    </div>
  );
}
