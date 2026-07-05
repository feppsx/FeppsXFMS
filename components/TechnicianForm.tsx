"use client";

// Create OR edit a technician. Same UI, mode is decided by presence of `initial`.
// In edit mode: email + password fields are hidden (auth account already exists).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTechnician, updateTechnician } from "@/lib/actions/technicians";
import { SignatureUpload } from "@/components/SignatureUpload";
import { AvatarUpload } from "@/components/AvatarUpload";
import type { Profile, TicketCategory } from "@/lib/db-types";
import { Loader2, Save } from "lucide-react";

interface Props {
  categories: Pick<TicketCategory, "id" | "name">[];
  initial?: Profile & { trades: string[] };  // trades = category ids
}

export function TechnicianForm({ categories, initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(
    new Set(initial?.trades ?? [])
  );
  const [signaturePath, setSignaturePath] = useState<string | null>(
    initial?.signature_path ?? null
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initial?.avatar_url ?? null
  );
  // For storage folder — real user id in edit mode, random in create mode.
  const [uploadFolder] = useState<string>(() =>
    initial?.id ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : "new")
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleTrade(id: string) {
    setSelectedTrades((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    // Wipe whatever the browser might auto-serialize and set the current selection.
    formData.delete("trade_ids");
    selectedTrades.forEach((id) => formData.append("trade_ids", id));
    formData.set("signature_path", signaturePath ?? "");
    formData.set("avatar_url", avatarUrl ?? "");

    startTransition(async () => {
      const res = isEdit
        ? await updateTechnician(initial!.id, formData)
        : await createTechnician(formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push("/admin/technicians");
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
            placeholder="tech@example.com"
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

      {isEdit && initial && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Signature <span className="text-xs font-normal text-slate-500">(optional)</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Shows on the &ldquo;Technical Team Leader&rdquo; line of invoices this tech generates.
          </p>
          <SignatureUpload
            userId={initial.id}
            value={signaturePath}
            onChange={setSignaturePath}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Trades <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Pick every category this technician can handle. They&apos;ll be highlighted when you assign matching tickets.
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = selectedTrades.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleTrade(c.id)}
                className={
                  active
                    ? "text-sm rounded-full bg-brand text-white px-3 py-1"
                    : "text-sm rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1"
                }
              >
                {c.name}
              </button>
            );
          })}
        </div>
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
          {isEdit ? "Save changes" : "Add technician"}
        </button>
        {!isEdit && (
          <span className="text-xs text-slate-500">
            Share the login email + temp password with them. They can change it via Forgot password.
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
