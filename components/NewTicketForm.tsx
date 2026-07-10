"use client";

import { useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTicket } from "@/lib/actions/tickets";
import { Camera, X, Loader2, Send } from "lucide-react";
import Image from "next/image";
import type { Client, ClientTenant, TicketCategory } from "@/lib/db-types";

interface UploadedPhoto {
  path: string;
  name: string;
  previewUrl: string;
}

export function NewTicketForm({
  clients,
  tenants,
  categories,
}: {
  clients: Pick<Client, "id" | "name" | "location">[];
  /** All active tenants across all clients; we filter to the chosen client. */
  tenants: Pick<ClientTenant, "id" | "name" | "client_id">[];
  categories: Pick<TicketCategory, "id" | "name">[];
}) {
  const [clientId, setClientId] = useState<string>("");
  const [tenantId, setTenantId] = useState<string>("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      if (!file.type.startsWith("image/")) {
        setUploadError(`Skipped ${file.name} — not an image.`); continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`Skipped ${file.name} — larger than 10 MB.`); continue;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const rand = crypto.randomUUID();
      const path = `tickets/new/${rand}.${ext}`;
      const { error } = await supabase.storage.from("ticket-attachments")
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

  function handleSubmit(formData: FormData) {
    for (const ph of photos) {
      formData.append("photo_paths", ph.path);
      formData.append("photo_names", ph.name);
    }
    setFormError(null);
    startTransition(async () => {
      const result = await createTicket(formData);
      if (result?.error) setFormError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Short title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          required minLength={3} maxLength={200}
          placeholder="e.g. 4th floor west wing lights not working"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Location (Estate) <span className="text-red-500">*</span>
        </label>
        <select
          name="client_id"
          required
          value={clientId}
          onChange={(e) => { setClientId(e.target.value); setTenantId(""); }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
        >
          <option value="" disabled>Select an estate…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name} — {c.location}</option>
          ))}
        </select>
        {clients.length === 0 && (
          <p className="text-xs text-slate-500 mt-1">
            No clients yet. Ask the 360 admin to add one.
          </p>
        )}
      </div>

      {tenantsForClient.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Company (Tenant) <span className="text-red-500">*</span>
          </label>
          <select
            name="tenant_id"
            required
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="" disabled>Select your company…</option>
            {tenantsForClient.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            This site has multiple companies inside it. Pick yours so 360 knows who to bill / brief.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Specific area</label>
        <input
          name="specific_area"
          placeholder="e.g. 4th floor B wing, near lift lobby"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Unit number <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          name="unit_number"
          placeholder="e.g. #06-11, Blk 71-A"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select name="category_id" defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white">
            <option value="">Unspecified</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select name="priority" defaultValue="medium"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white">
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
          name="description" required rows={4}
          placeholder="What's wrong, when did you notice it, any impact on operations…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

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

      {formError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {formError}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending || uploading}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-medium rounded-lg px-5 py-2.5 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit ticket
        </button>
      </div>
    </form>
  );
}
