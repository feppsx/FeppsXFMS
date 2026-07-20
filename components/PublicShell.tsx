// Public shell for anonymous /report and /track pages.
// Matches the mobile mockups: red curved band at the very top of the viewport,
// then the FM 360 SM logo + wordmark centered below.

import Image from "next/image";
import Link from "next/link";

export function PublicShell({
  children,
  showTrackLink = true,
  showCurve = true,
}: {
  children: React.ReactNode;
  showTrackLink?: boolean;
  showCurve?: boolean;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Red curved top band */}
      {showCurve && (
        <div className="relative bg-brand-red h-24 rounded-b-[40px]" aria-hidden />
      )}

      {/* Logo + wordmark row */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <Link href="/report" className="inline-flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="360 Integrated"
            width={64}
            height={64}
            className="h-14 w-auto object-contain logo-live"
            unoptimized
            priority
          />
          <span className="font-extrabold text-2xl tracking-tight">
            <span className="text-brand-blue">FM</span>{" "}
            <span className="text-slate-900">360</span>{" "}
            <span className="text-brand-red">SM</span>
          </span>
        </Link>
        {showTrackLink && (
          <Link
            href="/track"
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            Check status
          </Link>
        )}
      </div>

      <main className="flex-1 px-4 md:px-6 py-4 md:py-6 max-w-3xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
