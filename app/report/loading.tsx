export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="w-32 h-9 bg-slate-100 rounded shimmer relative overflow-hidden" />
          <div className="w-20 h-5 bg-slate-100 rounded shimmer relative overflow-hidden" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 md:py-10 animate-pulse">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7">
          <div className="h-7 w-48 bg-slate-200 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
