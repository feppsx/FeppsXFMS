// Minimal shell for the public /report and /track pages — logo header, no sidebar.
import Image from "next/image";
import Link from "next/link";

export function PublicShell({
  children,
  showTrackLink = true,
}: {
  children: React.ReactNode;
  showTrackLink?: boolean;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/report" className="inline-flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="360 Integrated"
              width={130}
              height={36}
              className="h-9 w-auto object-contain"
              unoptimized
              priority
            />
          </Link>
          {showTrackLink && (
            <Link
              href="/track"
              className="text-sm text-slate-600 hover:text-brand"
            >
              Check status
            </Link>
          )}
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">{children}</main>
    </div>
  );
}
