"use client";

// Subscribes to Postgres changes on tickets + related tables and refreshes
// the server component when anything relevant changes.
// Drop this into a page — it renders nothing.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  /** If provided, only refresh when THIS ticket (or its rows) changes. */
  ticketId?: string;
  /** If true, refresh on any ticket-table change (used for list/queue pages). */
  listMode?: boolean;
}

export function TicketRealtime({ ticketId, listMode }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(
      ticketId ? `ticket-${ticketId}` : "tickets-list"
    );

    // For a specific ticket, filter server-side so we only get events we care about.
    if (ticketId) {
      channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tickets", filter: `id=eq.${ticketId}` },
          () => router.refresh()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "ticket_status_history",
            filter: `ticket_id=eq.${ticketId}`,
          },
          () => router.refresh()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "ticket_attachments",
            filter: `ticket_id=eq.${ticketId}`,
          },
          () => router.refresh()
        );
    } else if (listMode) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => router.refresh()
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, listMode, router]);

  return null;
}
