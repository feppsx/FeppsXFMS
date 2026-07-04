"use client";

// Client add / edit form. Same UI, mode is decided by presence of `initial`.

import { useState, useTransition } from "react";
import { createClientRecord, updateClientRecord } from "@/lib/actions/clients";
import type { Client } from "@/lib/db-types";
import { Loader2, Save } from "lucide-react";

export function NewClientForm({ initial }: { initial?: Client }) {
  const isEdit = !!initial;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = isEdit
        ? await updateClientRecord(initial.id, formData)
        : await createClientRecord(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name"     name="name"     required defaultValue={initial?.name}     placeholder="e.g. Wipro" />
        <Field label="Location" name="location" required defaultValue={initial?.location} placeholder="e.g. Chennai CDC5" />
      </div>

      <Field label="Address" name="address" defaultValue={initial?.address ?? ""} placeholder="e.g. Sholinganallur, Chennai 600119" />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Contact email" name="contact_email" type="email" defaultValue={initial?.contact_email ?? ""} placeholder="ops@wipro.example" />
        <Field label="Contact phone" name="contact_phone" defaultValue={initial?.contact_phone ?? ""} placeholder="+91 44 …" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          placeholder="Anything technicians should know before dispatch"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-medium rounded-lg px-5 py-2.5 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? "Save changes" : "Save client"}
        </button>
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
