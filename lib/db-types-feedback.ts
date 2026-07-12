// Additional types for feedback (kept separate to avoid touching db-types.ts).
export interface TicketFeedback {
  id: string;
  ticket_id: string;
  rating: number;
  would_recommend: boolean | null;
  comment: string | null;
  submitted_by: string | null;
  submitted_via: "app" | "public-link" | "tracking-token";
  created_at: string;
}
