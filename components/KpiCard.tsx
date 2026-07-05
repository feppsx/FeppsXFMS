import Link from "next/link";
import { cn } from "@/lib/utils";

/** Compact KPI card for the admin dashboard. */
export function KpiCard({
  label, value, hint, tone = "default", href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "amber" | "red" | "emerald" | "brand";
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "bg-white border rounded-2xl p-4 h-full",
        tone === "default"  && "border-slate-200",
        tone === "amber"    && "border-amber-200 bg-amber-50",
        tone === "red"      && "border-rose-200 bg-rose-50",
        tone === "emerald"  && "border-emerald-200 bg-emerald-50",
        tone === "brand"    && "border-brand-100 bg-brand-50",
        href && "hover:border-brand hover:shadow-sm transition"
      )}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</div>
      <div className="text-2xl font-semibold mt-1 text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}
