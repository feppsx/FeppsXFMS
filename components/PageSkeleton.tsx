// Shared loading skeletons for the app's loading.tsx boundaries.
// Rendered by Next.js instantly on route change while the server component fetches.

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-brand font-semibold">360 Integrated</div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-40 h-4 rounded bg-slate-100" />
            <div className="w-24 h-8 rounded-lg bg-slate-100" />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 animate-pulse">{children}</main>
    </div>
  );
}

/** Skeleton for admin dashboard (KPI cards + activity). */
export function DashboardSkeleton() {
  return (
    <Shell>
      <div className="h-6 w-32 bg-slate-200 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 border border-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="h-40 bg-slate-100 border border-slate-200 rounded-2xl" />
          <div className="h-60 bg-slate-100 border border-slate-200 rounded-2xl" />
        </div>
        <div className="h-60 bg-slate-100 border border-slate-200 rounded-2xl" />
      </div>
    </Shell>
  );
}

/** Skeleton for list pages (tickets, invoices, clients, techs, categories). */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-8 w-24 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-9 w-full bg-slate-100 rounded-lg mb-3" />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-20 bg-slate-100 rounded-full" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 border border-slate-200 rounded-xl" />
        ))}
      </div>
    </Shell>
  );
}

/** Skeleton for detail pages (ticket detail, client detail, tech detail). */
export function DetailSkeleton() {
  return (
    <Shell>
      <div className="h-4 w-20 bg-slate-200 rounded mb-3" />
      <div className="h-6 w-2/3 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-1/3 bg-slate-100 rounded mb-4" />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className="h-32 bg-slate-100 border border-slate-200 rounded-2xl" />
          <div className="h-40 bg-slate-100 border border-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-100 border border-slate-200 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <div className="h-24 bg-slate-100 border border-slate-200 rounded-2xl" />
          <div className="h-60 bg-slate-100 border border-slate-200 rounded-2xl" />
        </div>
      </div>
    </Shell>
  );
}

/** Skeleton for form pages (new ticket, new client, edit …). */
export function FormSkeleton() {
  return (
    <Shell>
      <div className="h-4 w-16 bg-slate-200 rounded mb-3" />
      <div className="h-6 w-1/3 bg-slate-200 rounded mb-4" />
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-lg" />
        ))}
        <div className="h-10 w-32 bg-brand/40 rounded-lg" />
      </div>
    </Shell>
  );
}
