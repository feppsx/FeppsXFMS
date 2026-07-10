import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ tickets: [] }, { status: 401 });

  const { data } = await supabase
    .from("tickets")
    .select("id, ticket_number, title, status")
    .order("created_at", { ascending: false });

  return new NextResponse(JSON.stringify({ tickets: data ?? [] }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
