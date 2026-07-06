export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="md:pl-64 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
          <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
          <div className="h-[680px] bg-slate-100 border border-slate-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
