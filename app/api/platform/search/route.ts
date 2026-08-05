// Search endpoint used by the platform header's live-search bar.
// Guarded server-side by requirePlatformAdmin. Returns JSON hits.
import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/guard";
import { platformSearch } from "@/lib/platform-search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Any non-platform-admin gets redirected inside requirePlatformAdmin.
  await requirePlatformAdmin();

  const q = new URL(req.url).searchParams.get("q") ?? "";
  const hits = await platformSearch(q);
  return NextResponse.json({ hits });
}
