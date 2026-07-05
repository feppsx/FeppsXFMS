// Empty-state block with inline SVG illustrations.
// Use anywhere a list is empty for a friendlier feel.

import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "tickets" | "invoices" | "clients" | "technicians" | "categories" | "generic";

interface Props {
  variant?: Variant;
  title: string;
  message?: string;
  action?: { href: string; label: string };
  children?: ReactNode;
}

export function EmptyState({ variant = "generic", title, message, action, children }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-card">
      <div className="mx-auto w-40 h-32 mb-4">
        <Illustration variant={variant} />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {message && <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{message}</p>}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium mt-4 shadow-card"
        >
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}

function Illustration({ variant }: { variant: Variant }) {
  const BRAND = "#0f4c81";
  const BRAND_LIGHT = "#d4e3f2";
  const ACCENT = "#f97316";
  const GREY = "#94a3b8";
  const GREY_LIGHT = "#e2e8f0";

  switch (variant) {
    case "tickets":
      return (
        <svg viewBox="0 0 160 128" className="w-full h-full">
          <ellipse cx="80" cy="118" rx="60" ry="6" fill={GREY_LIGHT} />
          <rect x="30" y="24" width="100" height="70" rx="10" fill={BRAND_LIGHT} stroke={BRAND} strokeWidth="2" />
          <circle cx="30" cy="59" r="5" fill="#fff" stroke={BRAND} strokeWidth="2" />
          <circle cx="130" cy="59" r="5" fill="#fff" stroke={BRAND} strokeWidth="2" />
          <line x1="35" y1="59" x2="125" y2="59" stroke={BRAND} strokeWidth="2" strokeDasharray="3 4" />
          <rect x="46" y="34" width="55" height="6" rx="3" fill={BRAND} />
          <rect x="46" y="76" width="40" height="4" rx="2" fill={GREY} />
          <circle cx="115" cy="30" r="10" fill={ACCENT} />
          <text x="115" y="34" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">!</text>
        </svg>
      );
    case "invoices":
      return (
        <svg viewBox="0 0 160 128" className="w-full h-full">
          <ellipse cx="80" cy="118" rx="60" ry="6" fill={GREY_LIGHT} />
          <path d="M50 18 h60 v88 l-10 -6 -10 6 -10 -6 -10 6 -10 -6 -10 6 z" fill="#fff" stroke={BRAND} strokeWidth="2" />
          <line x1="60" y1="36" x2="100" y2="36" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="60" y1="52" x2="90"  y2="52" stroke={GREY} strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="64" x2="90"  y2="64" stroke={GREY} strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="80" x2="100" y2="80" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "clients":
      return (
        <svg viewBox="0 0 160 128" className="w-full h-full">
          <ellipse cx="80" cy="118" rx="60" ry="6" fill={GREY_LIGHT} />
          <rect x="35" y="42" width="40" height="65" fill={BRAND_LIGHT} stroke={BRAND} strokeWidth="2" />
          <rect x="85" y="30" width="45" height="77" fill="#fff" stroke={BRAND} strokeWidth="2" />
          {[0,1,2,3].map(row => [0,1].map(col => (
            <rect key={`a-${row}-${col}`} x={41 + col*14} y={49 + row*13} width="8" height="8" fill={BRAND} />
          )))}
          {[0,1,2,3].map(row => [0,1,2].map(col => (
            <rect key={`b-${row}-${col}`} x={90 + col*12} y={38 + row*15} width="7" height="8" fill={ACCENT} opacity="0.85" />
          )))}
        </svg>
      );
    case "technicians":
      return (
        <svg viewBox="0 0 160 128" className="w-full h-full">
          <ellipse cx="80" cy="118" rx="60" ry="6" fill={GREY_LIGHT} />
          <circle cx="80" cy="52" r="18" fill={BRAND_LIGHT} stroke={BRAND} strokeWidth="2" />
          <path d="M50 108 c 5 -22 20 -32 30 -32 s 25 10 30 32 z" fill={BRAND_LIGHT} stroke={BRAND} strokeWidth="2" />
          <circle cx="110" cy="30" r="10" fill={ACCENT} />
          <path d="M105 30 l 3 3 l 7 -7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "categories":
      return (
        <svg viewBox="0 0 160 128" className="w-full h-full">
          <ellipse cx="80" cy="118" rx="60" ry="6" fill={GREY_LIGHT} />
          <rect x="26" y="30" width="46" height="22" rx="11" fill="#3b82f6" opacity="0.85" />
          <rect x="80" y="30" width="54" height="22" rx="11" fill="#10b981" opacity="0.85" />
          <rect x="34" y="58" width="60" height="22" rx="11" fill="#f59e0b" opacity="0.85" />
          <rect x="100" y="58" width="34" height="22" rx="11" fill="#ef4444" opacity="0.85" />
          <rect x="42" y="86" width="50" height="22" rx="11" fill="#a855f7" opacity="0.85" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 160 128" className="w-full h-full">
          <ellipse cx="80" cy="118" rx="60" ry="6" fill={GREY_LIGHT} />
          <rect x="40" y="30" width="80" height="66" rx="8" fill={BRAND_LIGHT} stroke={BRAND} strokeWidth="2" />
          <line x1="55" y1="55" x2="105" y2="55" stroke={BRAND} strokeWidth="3" strokeLinecap="round" />
          <line x1="55" y1="70" x2="90"  y2="70" stroke={GREY} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
}
