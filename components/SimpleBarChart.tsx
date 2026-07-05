// Zero-dependency bar chart. Renders each bar as a div with tailwind classes.
// Not fancy — but good enough for "tickets per day, last 14 days".

export function SimpleBarChart({
  data, height = 100,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end gap-0.5"
              title={`${d.label}: ${d.value}`}
            >
              <div className="text-[10px] text-slate-500">
                {d.value > 0 ? d.value : ""}
              </div>
              <div
                className={
                  d.value > 0
                    ? "w-full bg-brand rounded-t"
                    : "w-full bg-slate-100 rounded-t"
                }
                style={{ height: `${Math.max(pct, d.value > 0 ? 4 : 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-500 truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
