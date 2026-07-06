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

  // Simple query — what RLS lets us see.
  const simple = await supabase
    .from("tickets")
    .select("id, ticket_number, title, status, assigned_to, created_at")
    .order("created_at", { ascending: false });

  // EXACT same query as /technician/jobs page uses:
  const complex = await supabase
    .from("tickets")
    .select(`
      *,
      category:ticket_categories(name, color),
      client:clients(name, location),
      tenant:client_tenants(name)
    `)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    auth_uid: user.id,
    email: user.email,
    profile,
    simple_query: {
      count: simple.data?.length ?? 0,
      error: simple.error?.message ?? null,
    },
    jobs_page_query: {
      count: complex.data?.length ?? 0,
      error: complex.error?.message ?? null,
      first_row_keys: complex.data?.[0] ? Object.keys(complex.data[0]) : null,
      first_row: complex.data?.[0] ?? null,
    },
  });
}
