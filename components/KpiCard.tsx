import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Colorful KPI card for the admin dashboard. */
export function KpiCard({
  label, value, hint, tone = "default", href, icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "amber" | "red" | "emerald" | "brand" | "accent" | "purple";
  href?: string;
  icon?: ReactNode;
}) {
  const inner = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 h-full border shadow-card transition",
        tone === "default"  && "bg-white border-slate-200",
        tone === "amber"    && "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
        tone === "red"      && "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200",
        tone === "emerald"  && "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
        tone === "brand"    && "bg-gradient-to-br from-brand-50 to-brand-100 border-brand-200",
        tone === "accent"   && "bg-gradient-to-br from-accent-50 to-accent-100 border-accent-500/30",
        tone === "purple"   && "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
        href && "hover:border-brand hover:-translate-y-0.5 hover:shadow-pop"
      )}
    >
      {icon && (
        <div className={cn(
          "absolute top-3 right-3 opacity-70",
          tone === "brand"   && "text-brand",
          tone === "amber"   && "text-amber-700",
          tone === "red"     && "text-rose-700",
          tone === "emerald" && "text-emerald-700",
          tone === "accent"  && "text-accent-600",
          tone === "purple"  && "text-purple-700",
          tone === "default" && "text-slate-500",
        )}>
          {icon}
        </div>
      )}
      <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">{label}</div>
      <div className={cn(
        "text-2xl font-bold mt-1",
        tone === "brand"   && "text-brand-700",
        tone === "amber"   && "text-amber-900",
        tone === "red"     && "text-rose-900",
        tone === "emerald" && "text-emerald-900",
        tone === "accent"  && "text-accent-600",
        tone === "purple"  && "text-purple-900",
        tone === "default" && "text-slate-900",
      )}>{value}</div>
      {hint && <div className="text-xs text-slate-600 mt-1">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}
