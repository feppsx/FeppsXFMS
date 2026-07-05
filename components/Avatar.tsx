// Small avatar renderer — shows profile photo if present, otherwise falls back
// to colored initials on a filled circle.

import Image from "next/image";
import { cn } from "@/lib/utils";

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Deterministic hue from a string — same name always gets the same color. */
function hueFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function Avatar({
  name, url, size = 32, className,
}: {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = initialsFor(name);
  const hue = hueFor(name);

  if (url) {
    return (
      <div
        className={cn("relative rounded-full overflow-hidden bg-slate-100 shrink-0", className)}
        style={{ width: size, height: size }}
      >
        <Image src={url} alt={name} fill className="object-cover" unoptimized />
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-full flex items-center justify-center text-white font-semibold shrink-0", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.36),
        backgroundColor: `hsl(${hue}, 55%, 42%)`,
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
