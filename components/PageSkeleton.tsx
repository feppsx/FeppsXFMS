// Loading skeletons that render into Next.js's Suspense boundaries via loading.tsx.
// Layout mimics the sidebar shell so the transition feels seamless.

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fake sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-10">
        <div className="px-6 py-5 border-b border-slate-100 h-[76px] flex items-center">
          <div className="h-8 w-32 bg-slate-100 rounded" />
        </div>
        <div className="flex-1 p-3 space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-slate-100" />
          ))}
        </div>
        <div className="border-t border-slate-100 p-4 space-y-2">
          <div className="h-10 rounded-lg bg-slate-100" />
          <div className="h-8 rounded-lg bg-slate-100" />
        </div>
      </aside>

      {/* Mobile fake header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-10 bg-white border-b border-slate-200 flex items-center px-4 gap-3">
        <div className="w-6 h-6 bg-slate-100 rounded" />
        <div className="w-24 h-6 bg-slate-100 rounded" />
      </div>

      <main className="md:pl-64 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">{children}</div>
      </main>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Shell>
      <div className="h-6 w-32 bg-slate-200 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="h-40 bg-white border border-slate-200 rounded-2xl" />
          <div className="h-60 bg-white border border-slate-200 rounded-2xl" />
        </div>
        <div className="h-60 bg-white border border-slate-200 rounded-2xl" />
      </div>
    </Shell>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-8 w-24 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-9 w-full bg-white border border-slate-200 rounded-lg mb-3" />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-20 bg-white border border-slate-200 rounded-full" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-white border border-slate-200 rounded-xl" />
        ))}
      </div>
    </Shell>
  );
}

export function DetailSkeleton() {
  return (
    <Shell>
      <div className="h-4 w-20 bg-slate-200 rounded mb-3" />
      <div className="h-6 w-2/3 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-1/3 bg-slate-100 rounded mb-4" />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className="h-32 bg-white border border-slate-200 rounded-2xl" />
          <div className="h-40 bg-white border border-slate-200 rounded-2xl" />
          <div className="h-32 bg-white border border-slate-200 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
          <div className="h-60 bg-white border border-slate-200 rounded-2xl" />
        </div>
      </div>
    </Shell>
  );
}

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
