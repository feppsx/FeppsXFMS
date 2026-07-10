"use client";

// Client-side estate list that polls /api/my-estates every 5s. This makes the
// tech's My Estates page behave identically to the admin dashboard: the estate
// pops to the top, the red badge appears, and the toast fires — all within
// 5 seconds of an assignment, without depending on router.refresh() timing.

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EstateCard } from "./EstateCard";
import { EmptyState } from "./EmptyState";
import type { EstateCardData } from "@/lib/estate-data";

const POLL_MS = 5000;

export function EstatesLive({
  initial,
  hrefBase,
}: {
  initial: EstateCardData[];
  hrefBase: string;
}) {
  const [estates, setEstates] = useState<EstateCardData[]>(initial);
  const knownCounts = useRef<Map<string, number>>(
    new Map(initial.map((e) => [e.id, e.new_count]))
  );

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch("/api/my-estates", {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });
        if (!res.ok) return;
        const json: { estates: EstateCardData[] } = await res.json();
        const next = json.estates ?? [];

        // Compare new_count per estate — if any went up, toast.
        for (const e of next) {
          const prev = knownCounts.current.get(e.id) ?? 0;
          if (e.new_count > prev) {
            const delta = e.new_count - prev;
            toast.success(
              `${delta} new ticket${delta === 1 ? "" : "s"} on ${e.name} · ${e.location}`,
              { duration: 8000 }
            );
          }
        }
        knownCounts.current = new Map(next.map((e) => [e.id, e.new_count]));
        setEstates(next);
      } catch (err) {
        console.warn("[EstatesLive] poll failed", err);
      }
    }

    const onFocus = () => poll();
    const onVis = () => { if (document.visibilityState === "visible") poll(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(id);
    };
  }, []);

  if (estates.length === 0) {
    return (
      <EmptyState
        variant="clients"
        title="No active estates yet."
        message="Ask the admin to add an estate to get started."
      />
    );
  }

  return (
    <div className="space-y-2">
      {estates.map((e) => (
        <EstateCard key={e.id} data={e} hrefBase={hrefBase} />
      ))}
    </div>
  );
}
