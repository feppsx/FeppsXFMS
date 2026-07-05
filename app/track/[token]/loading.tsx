export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 h-14" />
      <main className="max-w-3xl mx-auto px-4 py-6 md:py-10 animate-pulse space-y-4">
        <div className="h-6 w-1/2 bg-slate-200 rounded" />
        <div className="h-4 w-1/3 bg-slate-100 rounded" />
        <div className="h-24 bg-slate-100 border border-slate-200 rounded-2xl" />
        <div className="h-40 bg-slate-100 border border-slate-200 rounded-2xl" />
      </main>
    </div>
  );
}
