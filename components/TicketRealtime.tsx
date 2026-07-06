"use client";

// Realtime + poll fallback + new-assignment toast.
//
// - Supabase Realtime is our primary signal, but can drop events for a tech
//   when RLS visibility flips on assignment. So we also:
// - Poll every 5s while the tab is visible.
// - Refresh on focus / visibility change.
// - Compare the visible ticket-ids to the previous snapshot and show a toast
//   the moment a NEW ticket appears in the tech's assigned list.

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Props {
  ticketId?: string;
  listMode?: boolean;
}

const POLL_MS = 5000;

export function TicketRealtime({ ticketId, listMode }: Props) {
  const router = useRouter();
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(
      ticketId ? `ticket-${ticketId}` : "tickets-list"
    );

    if (ticketId) {
      channel
        .on(
          "postgres_changes" as never,
          { event: "*", schema: "public", table: "tickets", filter: `id=eq.${ticketId}` },
          () => router.refresh()
        )
        .on(
          "postgres_changes" as never,
          { event: "*", schema: "public", table: "ticket_status_history", filter: `ticket_id=eq.${ticketId}` },
          () => router.refresh()
        )
        .on(
          "postgres_changes" as never,
          { event: "*", schema: "public", table: "ticket_attachments", filter: `ticket_id=eq.${ticketId}` },
          () => router.refresh()
        );
    } else if (listMode) {
      channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "tickets" },
        () => router.refresh()
      );
    }

    channel.subscribe();

    // In list mode, watch for new tickets appearing (server-side RLS decides
    // what we see; we just diff the id set on the client).
    async function detectNew() {
      if (!listMode) return;
      const { data } = await supabase
        .from("tickets")
        .select("id, ticket_number, title, status")
        .order("created_at", { ascending: false });
      if (!data) return;
      const currentIds = new Set(data.map((t) => t.id as string));
      if (knownIds.current !== null) {
        for (const t of data) {
          if (!knownIds.current.has(t.id as string)) {
            toast.success(`New job assigned: ${t.ticket_number} — ${t.title}`, {
              duration: 8000,
            });
            router.refresh();
            break;
          }
        }
      }
      knownIds.current = currentIds;
    }

    // Initial baseline so we don't toast on the first mount.
    detectNew();

    const onFocus = () => {
      router.refresh();
      detectNew();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        detectNew();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const pollId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
        detectNew();
      }
    }, POLL_MS);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(pollId);
    };
  }, [ticketId, listMode, router]);

  return null;
}
