"use client";

// Bulletproof update loop + on-screen debug badge so we can VISUALLY confirm
// this code is running on the tech's device.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  ticketId?: string;
  listMode?: boolean;
}

const POLL_MS = 5000;
const BUILD_TAG = "TR-v7-serverpoll";

interface Snap { id: string; ticket_number: string; title: string; status: string; }

export function TicketRealtime({ listMode }: Props) {
  const router = useRouter();
  const known = useRef<Map<string, string> | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [lastAt, setLastAt] = useState<string>("—");
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch("/api/my-tickets", {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });
        if (!res.ok) return;
        const json: { tickets: Snap[] } = await res.json();
        const tickets = json.tickets ?? [];
        const currentState = new Map<string, string>(tickets.map((t) => [t.id, t.status]));

        if (known.current !== null) {
          for (const t of tickets) {
            const prev = known.current.get(t.id);
            const isBrandNew = prev === undefined;
            const flippedToAssigned = prev !== undefined && prev !== "assigned" && t.status === "assigned";
            if (isBrandNew || flippedToAssigned) {
              const msg = isBrandNew
                ? `New job assigned: ${t.ticket_number} — ${t.title}`
                : `Job re-assigned to you: ${t.ticket_number} — ${t.title}`;
              toast.success(msg, { duration: 8000 });
              router.refresh();
              break;
            }
          }
        }
        known.current = currentState;
        setVisibleCount(tickets.length);
        setPollCount((c) => c + 1);
        setLastAt(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn("[TicketRealtime] poll failed", err);
      }
    }

    poll();
    const onFocus = () => { router.refresh(); poll(); };
    const onVis = () => { if (document.visibilityState === "visible") { router.refresh(); poll(); } };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") { router.refresh(); poll(); }
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(id);
    };
  }, [listMode, router]);

  if (!listMode) return null;

  // Small debug badge so the tech / you can VISUALLY confirm this code is running.
  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 9999,
        background: "#0f4c81",
        color: "white",
        padding: "6px 10px",
        borderRadius: 8,
        fontSize: 11,
        fontFamily: "monospace",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      }}
    >
      {BUILD_TAG} · polls: {pollCount} · last: {lastAt} · tickets: {visibleCount ?? "?"}
    </div>
  );
}
