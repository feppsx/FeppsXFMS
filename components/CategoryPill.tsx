// Small colored pill for a ticket category. Uses inline style with the DB color
// so admins can pick any hex and it Just Works, no tailwind rebuild needed.

const DEFAULT = "#64748b";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  if (clean.length === 6) {
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }
  return [100, 116, 139];
}

export function CategoryPill({
  name, color, className,
}: {
  name: string | null | undefined;
  color?: string | null;
  className?: string;
}) {
  if (!name) return null;
  const c = color && color.startsWith("#") ? color : DEFAULT;
  const [r, g, b] = hexToRgb(c);
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border " +
        (className ?? "")
      }
      style={{
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.10)`,
        color: c,
        borderColor:     `rgba(${r}, ${g}, ${b}, 0.30)`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
        style={{ backgroundColor: c }}
      />
      {name}
    </span>
  );
}
