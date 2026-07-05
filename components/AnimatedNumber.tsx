"use client";

import { useEffect, useState } from "react";

/**
 * Animates a numeric value counting from 0 up to `to` over `duration` ms.
 * Ease-out cubic. Used for KPI cards on the admin dashboard.
 */
export function AnimatedNumber({
  to, duration = 700, prefix = "", suffix = "",
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isFinite(to)) return;
    let raf: number;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return (
    <>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </>
  );
}
