"use client";

// Create OR edit a Manager. Same UI, mode is decided by presence of `initial`.
// In edit mode: email + password fields are hidden (auth account already exists).
// No trades — that's the difference from TechnicianForm.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManager, updateManager } from "@/lib/actions/managers";
import { AvatarUpload } from "@/components/AvatarUpload";
import type { Profile } from "@/lib/db-types";
import { Loader2, Save } from "lucide-react";

interface Props {
  initial?: Profile;
}

export function ManagerForm({ initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial?.avatar_url ?? null);
  const [uploadFolder] = useState<string>(() =>
    initial?.id ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : "new")
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("avatar_url", avatarUrl ?? "");

    startTransition(async () => {
      const res = isEdit
        ? await updateManager(initial!.id, formData)
        : await createManager(formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push("/admin/managers");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name" name="full_name" required defaultValue={initial?.full_name} />
        <Field label="Phone" name="phone" defaultValue={initial?.phone ?? ""} placeholder="+65 9000 0000" />
      </div>

      {!isEdit && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Login email"
            name="email"
            type="email"
            required
            placeholder="manager@example.com"
          />
          <Field
            label="Temporary password"
            name="password"
            type="text"
            required
            placeholder="min 8 characters"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Profile photo <span className="text-xs font-normal text-slate-500">(optional)</span>
        </label>
        <AvatarUpload
          userId={uploadFolder}
          value={avatarUrl}
          onChange={setAvatarUrl}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="pt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-medium rounded-lg px-5 py-2.5 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? "Save changes" : "Add manager"}
        </button>
        {!isEdit && (
          <span className="text-xs text-slate-500">
            Share the login email + temp password. They can change it via Forgot password.
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label, name, required, placeholder, type = "text", defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
