"use client";

// Manages the tenants under one client. Shown on the client's edit page.

import { useState, useTransition } from "react";
import { createTenant, toggleTenantActive } from "@/lib/actions/tenants";
import type { ClientTenant } from "@/lib/db-types";
import { Loader2, Plus, Power, X } from "lucide-react";

export function TenantManager({
  clientId,
  tenants,
}: {
  clientId: string;
  tenants: ClientTenant[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required.");
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("contact_email", email);
    fd.set("contact_phone", phone);
    startTransition(async () => {
      const res = await createTenant(clientId, fd);
      if (res.error) { setError(res.error); return; }
      setName(""); setEmail(""); setPhone(""); setShowForm(false);
    });
  }

  function toggle(t: ClientTenant) {
    if (!confirm(
      t.is_active
        ? `Deactivate tenant "${t.name}"? Requesters won't see them in the dropdown; existing tickets stay untouched.`
        : `Reactivate tenant "${t.name}"?`
    )) return;
    startTransition(async () => {
      await toggleTenantActive(t.id, clientId, !t.is_active);
    });
  }

  const active   = tenants.filter((t) => t.is_active);
  const inactive = tenants.filter((t) => !t.is_active);

  return (
    <div className="space-y-3">
      {tenants.length === 0 ? (
        <p className="text-sm text-slate-500">
          No tenants yet. If this client is a single-company site (like Wipro at Chennai CDC5), leave this empty.
          Add tenants only for multi-tenant buildings.
        </p>
      ) : (
        <div className="space-y-1.5">
          {[...active, ...inactive].map((t) => (
            <div
              key={t.id}
              className={
                t.is_active
                  ? "flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2"
                  : "flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 opacity-75"
              }
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-900">{t.name}</span>
                  {!t.is_active && (
                    <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5">
                      Inactive
                    </span>
                  )}
                </div>
                {(t.contact_email || t.contact_phone) && (
                  <div className="text-xs text-slate-500 truncate">
                    {t.contact_email && <span>{t.contact_email}</span>}
                    {t.contact_email && t.contact_phone && <span> · </span>}
                    {t.contact_phone && <span>{t.contact_phone}</span>}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggle(t)}
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-2 py-1 text-xs font-medium disabled:opacity-60"
                title={t.is_active ? "Deactivate" : "Reactivate"}
              >
                <Power className="w-3 h-3" />
                {t.is_active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={submit} className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="Name" value={name}  onChange={setName}  required placeholder="e.g. Google" />
            <Field label="Contact email" value={email} onChange={setEmail} type="email" placeholder="ops@google.example" />
          </div>
          <Field label="Contact phone" value={phone} onChange={setPhone} placeholder="+65 …" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save tenant
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add tenant
        </button>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, required, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
