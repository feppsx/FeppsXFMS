"use client";

// Round profile-photo picker. Uploads to the 'signatures' bucket under
// avatars/<uid>/<uuid>.<ext> so we can reuse the existing storage policy,
// then hands the public URL back via onChange.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, X, UserRound } from "lucide-react";

const BUCKET = "signatures";

interface Props {
  /** Folder name for the storage path. In edit mode pass the profile id. */
  userId: string;
  /** Currently stored public URL (from profiles.avatar_url). May be null. */
  value: string | null;
  onChange: (url: string | null) => void;
  size?: number; // px
}

export function AvatarUpload({ userId, value, onChange, size = 96 }: Props) {
  const [preview, setPreview]     = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPreview(value); }, [value]);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) { setError("Photo must be an image."); return; }
    if (file.size > 4 * 1024 * 1024)     { setError("Photo must be under 4 MB."); return; }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) { setError(upErr.message); setUploading(false); return; }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
    setPreview(data.publicUrl);
    setUploading(false);
  }

  function remove() {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Profile photo"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <UserRound className="w-1/2 h-1/2 text-slate-400" />
        )}
        {preview && (
          <button
            type="button"
            onClick={remove}
            className="absolute -top-1 -right-1 bg-black/80 hover:bg-black text-white rounded-full p-1"
            aria-label="Remove photo"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="space-y-1">
        <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 text-sm font-medium cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {preview ? "Replace photo" : "Upload photo"}
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
        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="text-xs text-slate-500">Square photo works best. Max 4 MB.</p>
      </div>
    </div>
  );
}
