"use client";

// Realtime + poll fallback so the tech's page catches assignments even if
// the websocket event is dropped (which happens when RLS visibility changes).

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  ticketId?: string;
  listMode?: boolean;
}

const POLL_MS = 15000;

export function TicketRealtime({ ticketId, listMode }: Props) {
  const router = useRouter();

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

    const onFocus = () => router.refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const pollId = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
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
