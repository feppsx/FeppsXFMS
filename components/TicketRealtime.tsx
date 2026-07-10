"use client";

// Server-polled update loop for tech / manager portals.
//
// Polls /api/my-tickets every 5s (server enforces auth + RLS), refreshes on
// tab focus / visibility change, and shows a green toast the moment a new
// ticket becomes visible to the current user (or an existing one flips
// TO status=assigned).

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  ticketId?: string;
  listMode?: boolean;
}

const POLL_MS = 5000;

interface Snap { id: string; ticket_number: string; title: string; status: string; }

export function TicketRealtime({ listMode }: Props) {
  const router = useRouter();
  const known = useRef<Map<string, string> | null>(null);

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

  return null;
}
