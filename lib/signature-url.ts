// Resolves the public URL for a signature stored in the 'signatures' bucket.
// The bucket is public so no signing is needed — the returned URL loads directly
// from any browser (needed by @react-pdf/renderer's Image src in the PDF).
import { createClient } from "@/lib/supabase/server";

export async function signatureUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = supabase.storage.from("signatures").getPublicUrl(path);
  return data.publicUrl ?? null;
}
