import { NextResponse } from "next/server";
import { getEstateCards } from "@/lib/estate-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const estates = await getEstateCards();
  return new NextResponse(JSON.stringify({ estates }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
