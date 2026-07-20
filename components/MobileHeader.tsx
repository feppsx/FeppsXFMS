"use client";

// Red curved top header used on mobile (< md).
// Two variants:
//   * standard — back arrow + icon + title (job detail style)
//   * dashboard — no back, big greeting + optional overlapping search input
//
// This is a client component so the back button can call router.back().

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
  // Dashboard-style header with big greeting + optional search
  greeting?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
}

export function MobileHeader({
  title,
  subtitle,
  showBack,
  backHref,
  icon,
  rightAction,
  greeting,
  showSearch,
  searchPlaceholder = "Search…",
  onSearch,
}: Props) {
  const router = useRouter();

  return (
    <div className="md:hidden">
      <div
        className={
          "bg-brand-red text-white px-5 pt-6 rounded-b-[40px] " +
          (showSearch ? "pb-16" : "pb-6")
        }
      >
        <div className="flex items-center gap-3">
          {showBack && (
            backHref ? (
              <Link href={backHref} aria-label="Back" className="-ml-1 p-1 rounded-lg hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            ) : (
              <button type="button" onClick={() => router.back()} aria-label="Back" className="-ml-1 p-1 rounded-lg hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )
          )}
          {icon && <span className="opacity-90">{icon}</span>}
          <div className="flex-1 min-w-0">
            {greeting ? (
              <h1 className="text-xl font-semibold leading-tight truncate">{greeting}</h1>
            ) : (
              <>
                <h1 className="text-lg font-semibold leading-tight truncate">{title}</h1>
                {subtitle && <p className="text-sm text-white/85 truncate mt-0.5">{subtitle}</p>}
              </>
            )}
          </div>
          {rightAction && <div className="shrink-0">{rightAction}</div>}
        </div>
      </div>

      {/* Floating white search bar that overlaps the header bottom edge */}
      {showSearch && (
        <div className="px-5 -mt-12 mb-4">
          <div className="bg-white rounded-full shadow-float flex items-center gap-2 pl-4 pr-2 py-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
