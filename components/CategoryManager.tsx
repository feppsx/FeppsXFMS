"use client";

// Inline add/edit/deactivate categories with color picker.

import { useState, useTransition } from "react";
import { createCategory, updateCategory, toggleCategoryActive } from "@/lib/actions/categories";
import type { TicketCategory } from "@/lib/db-types";
import { CategoryPill } from "./CategoryPill";
import { Loader2, Plus, Save, X, Power, Pencil } from "lucide-react";

const PALETTE = [
  "#64748b", "#3b82f6", "#06b6d4", "#10b981",
  "#84cc16", "#f59e0b", "#f97316", "#ef4444",
  "#ec4899", "#a855f7", "#8b5cf6", "#0f4c81",
];

export function CategoryManager({ categories }: { categories: TicketCategory[] }) {
  const [showForm, setShowForm]         = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [name, setName]                 = useState("");
  const [description, setDescription]   = useState("");
  const [color, setColor]               = useState<string>(PALETTE[0]);
  const [error, setError]               = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();

  function startAdd() {
    setEditingId(null);
    setName(""); setDescription(""); setColor(PALETTE[1]);
    setShowForm(true);
  }
  function startEdit(c: TicketCategory) {
    setEditingId(c.id);
    setName(c.name); setDescription(c.description ?? ""); setColor(c.color);
    setShowForm(true);
  }
  function cancel() {
    setShowForm(false); setEditingId(null); setError(null);
    setName(""); setDescription(""); setColor(PALETTE[0]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required.");
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("description", description);
    fd.set("color", color);
    startTransition(async () => {
      const res = editingId
        ? await updateCategory(editingId, fd)
        : await createCategory(fd);
      if (res.error) { setError(res.error); return; }
      cancel();
    });
  }

  function toggle(c: TicketCategory) {
    startTransition(async () => {
      await toggleCategoryActive(c.id, !c.is_active);
    });
  }

  const active   = categories.filter((c) => c.is_active);
  const inactive = categories.filter((c) => !c.is_active);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {[...active, ...inactive].map((c) => (
          <div
            key={c.id}
            className={
              c.is_active
                ? "flex items-start justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 gap-3 shadow-card"
                : "flex items-start justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 gap-3 opacity-75"
            }
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryPill name={c.name} color={c.color} />
                {!c.is_active && (
                  <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">Inactive</span>
                )}
              </div>
              {c.description && (
                <div className="text-xs text-slate-500 mt-1">{c.description}</div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                type="button"
                onClick={() => startEdit(c)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-2 py-1 text-xs font-medium"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button
                type="button"
                onClick={() => toggle(c)}
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-2 py-1 text-xs font-medium disabled:opacity-60"
              >
                <Power className="w-3 h-3" />
                {c.is_active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-slate-500">No categories yet.</p>
        )}
      </div>

      {showForm ? (
        <form onSubmit={submit} className="border border-slate-200 rounded-xl p-4 bg-white shadow-card space-y-3">
          <div className="text-sm font-medium">
            {editingId ? "Edit category" : "Add category"}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
            <input
              type="text" value={name} required onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Locksmith"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#0f172a" : "rgba(0,0,0,0.1)",
                    transform: color === c ? "scale(1.1)" : "scale(1)",
                  }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="text-xs text-slate-500">
              Preview: <CategoryPill name={name || "Preview"} color={color} className="ml-1" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand hover:bg-brand-600 text-white px-3 py-2 text-sm font-medium shadow-card"
        >
          <Plus className="w-4 h-4" /> Add category
        </button>
      )}
    </div>
  );
}
