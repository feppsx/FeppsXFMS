"use client";

// Signature picker. Uploads a PNG/JPG to the 'signatures' bucket in Supabase
// Storage under signatures/<uid>/<uuid>.<ext>, then hands the storage path back
// via onChange so the parent form can persist it on the profile row.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, X } from "lucide-react";

interface Props {
  /** UUID of the profile owning the signature. Used to name the storage folder. */
  userId: string;
  /** Current stored path (from profiles.signature_path). May be null. */
  value: string | null;
  onChange: (path: string | null) => void;
}

const BUCKET = "signatures";

function publicUrl(path: string | null) {
  if (!path) return null;
  const supabase = createClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function SignatureUpload({ userId, value, onChange }: Props) {
  const [preview, setPreview]  = useState<string | null>(publicUrl(value));
  const [uploading, setUploading] = useState(false);
  const [error, setError]      = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(publicUrl(value));
  }, [value]);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Signature must be an image."); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Signature must be under 2 MB."); return;
    }
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `signatures/${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    onChange(path);
    setPreview(publicUrl(path));
    setUploading(false);
  }

  async function remove() {
    if (value) {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([value]).catch(() => {});
    }
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="inline-block relative border border-slate-200 rounded-lg p-2 bg-white">
          <Image
            src={preview}
            alt="Signature"
            width={160}
            height={80}
            unoptimized
            className="object-contain"
          />
          <button
            type="button"
            onClick={remove}
            className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white rounded-full p-1"
            aria-label="Remove signature"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="text-xs text-slate-500">No signature uploaded.</div>
      )}

      <div>
        <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 text-sm font-medium cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {preview ? "Replace signature" : "Upload signature"}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">
        Transparent PNG works best. Max 2 MB.
      </p>
    </div>
  );
}
