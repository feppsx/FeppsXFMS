import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const { data: myTickets, error: ticketsErr } = await supabase
    .from("tickets")
    .select("id, ticket_number, title, status, assigned_to, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    auth_uid: user.id,
    email: user.email,
    profile,
    visible_tickets_count: myTickets?.length ?? 0,
    visible_tickets: myTickets,
    tickets_error: ticketsErr?.message ?? null,
  });
}
