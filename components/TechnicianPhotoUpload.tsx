"use client";

// Photo uploader shown to a technician on the job detail page.
// Two flavors: "progress" during work, "resolution" after fix.
// Files upload to Supabase Storage first, then we record them via a Server Action.

import { useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { attachPhotosToTicket } from "@/lib/actions/attachments";
import type { AttachmentKind } from "@/lib/db-types";
import { Camera, X, Loader2, Save } from "lucide-react";

interface UploadedPhoto {
  path: string;
  name: string;
  previewUrl: string;
}

export function TechnicianPhotoUpload({
  ticketId,
  kind,
  title,
}: {
  ticketId: string;
  kind: Extract<AttachmentKind, "progress_photo" | "resolution_photo">;
  title: string;
}) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setSaved(false);
    setUploading(true);
    const supabase = createClient();

    const uploaded: UploadedPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError(`Skipped ${file.name} — not an image.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`Skipped ${file.name} — larger than 10 MB.`);
        continue;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const rand = crypto.randomUUID();
      const path = `tickets/${ticketId}/${rand}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("ticket-attachments")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        setError(`Upload failed for ${file.name}: ${upErr.message}`);
        continue;
      }
      uploaded.push({ path, name: file.name, previewUrl: URL.createObjectURL(file) });
    }
    setPhotos((p) => [...p, ...uploaded]);
    setUploading(false);
  }

  function save() {
    if (photos.length === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await attachPhotosToTicket(
        ticketId,
        photos.map((p) => ({ path: p.path, name: p.name })),
        kind
      );
      if (res.error) {
        setError(res.error);
      } else {
        photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setPhotos([]);
        setSaved(true);
      }
    });
  }

  async function removeStaged(idx: number) {
    const target = photos[idx];
    if (!target) return;
    const supabase = createClient();
    await supabase.storage.from("ticket-attachments").remove([target.path]).catch(() => {});
    URL.revokeObjectURL(target.previewUrl);
    setPhotos((p) => p.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <div key={p.path} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
            <Image src={p.previewUrl} alt={p.name} fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => removeStaged(i)}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
              aria-label="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-brand flex flex-col items-center justify-center text-slate-500 text-xs cursor-pointer">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Camera className="w-4 h-4 mb-0.5" />
              Add
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
      {photos.length > 0 && (
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save {photos.length} photo{photos.length === 1 ? "" : "s"}
        </button>
      )}
      {saved && <p className="text-xs text-emerald-600">Photos attached.</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
