// Loading skeletons with shimmer overlay so waits feel active.

function Bar({ className }: { className?: string }) {
  return <div className={"relative overflow-hidden bg-slate-100 shimmer " + (className ?? "")} />;
}

function CardBar({ className }: { className?: string }) {
  return (
    <div className={"relative overflow-hidden bg-white border border-slate-200 shimmer " + (className ?? "")} />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fake sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-10">
        <div className="px-6 py-5 border-b border-slate-100 h-[76px] flex items-center">
          <Bar className="h-8 w-32 rounded" />
        </div>
        <div className="flex-1 p-3 space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} className="h-8 rounded-lg" />
          ))}
        </div>
        <div className="border-t border-slate-100 p-4 space-y-2">
          <Bar className="h-10 rounded-lg" />
          <Bar className="h-8 rounded-lg" />
        </div>
      </aside>

      {/* Mobile fake header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-10 bg-white border-b border-slate-200 flex items-center px-4 gap-3">
        <Bar className="w-6 h-6 rounded" />
        <Bar className="w-24 h-6 rounded" />
      </div>

      <main className="md:pl-64 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Shell>
      <Bar className="h-6 w-32 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardBar key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <CardBar className="h-40 rounded-2xl" />
          <CardBar className="h-60 rounded-2xl" />
        </div>
        <CardBar className="h-60 rounded-2xl" />
      </div>
    </Shell>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <Bar className="h-6 w-32 rounded" />
        <Bar className="h-8 w-24 rounded-lg" />
      </div>
      <CardBar className="h-9 w-full rounded-lg mb-3" />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardBar key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <CardBar key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </Shell>
  );
}

export function DetailSkeleton() {
  return (
    <Shell>
      <Bar className="h-4 w-20 rounded mb-3" />
      <Bar className="h-6 w-2/3 rounded mb-2" />
      <Bar className="h-4 w-1/3 rounded mb-4" />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <CardBar className="h-32 rounded-2xl" />
          <CardBar className="h-40 rounded-2xl" />
          <CardBar className="h-32 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <CardBar className="h-24 rounded-2xl" />
          <CardBar className="h-60 rounded-2xl" />
        </div>
      </div>
    </Shell>
  );
}

export function FormSkeleton() {
  return (
    <Shell>
      <Bar className="h-4 w-16 rounded mb-3" />
      <Bar className="h-6 w-1/3 rounded mb-4" />
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bar key={i} className="h-10 rounded-lg" />
        ))}
        <div className="h-10 w-32 bg-brand/40 rounded-lg" />
      </div>
    </Shell>
  );
}
