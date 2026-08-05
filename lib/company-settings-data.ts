import { createClient } from "@/lib/supabase/server";

export interface CompanySettings {
  id: string;
  logo_path: string | null;
  logo_dark_path: string | null;
  stamp_path: string | null;
  company_name: string;
  tagline: string | null;
  uen: string;
  gst_reg: string | null;
  address_line: string | null;
  phone_office: string | null;
  phone_hotline: string | null;
  phone_whatsapp: string | null;
  email: string | null;
  website: string | null;
  badges_line: string | null;
  invoice_terms: string | null;
  quotation_terms: string | null;
  paynow_text: string | null;
}

export interface CompanyBranding extends CompanySettings {
  logo_url: string | null;
  logo_dark_url: string | null;
  stamp_url: string | null;
}

export async function getCompanyBranding(): Promise<CompanyBranding> {
  const supabase = await createClient();

  // Look up the caller's org first, then filter company_settings explicitly.
  // We used to rely on RLS + .limit(1), which was fragile.
  let orgId: string | null = null;
  let orgName = "Your Company Name";
  const { data: authData } = await supabase.auth.getUser();
  if (authData.user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", authData.user.id)
      .maybeSingle<{ organization_id: string }>();
    if (prof?.organization_id) {
      orgId = prof.organization_id;
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle<{ name: string }>();
      if (org?.name) orgName = org.name;
    }
  }

  const { data } = orgId
    ? await supabase
        .from("company_settings")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle<CompanySettings>()
    : { data: null };

  const fallback: CompanySettings = {
    id: "",
    logo_path: null,
    logo_dark_path: null,
    stamp_path: null,
    company_name: orgName,
    tagline: null,
    uen: "",
    gst_reg: null,
    address_line: null,
    phone_office: null,
    phone_hotline: null,
    phone_whatsapp: null,
    email: null,
    website: null,
    badges_line: null,
    invoice_terms: null,
    quotation_terms: null,
    paynow_text: null,
  };

  const s = data ?? fallback;

  async function sign(path: string | null): Promise<string | null> {
    if (!path) return null;
    const { data: signed } = await supabase.storage
      .from("company-assets")
      .createSignedUrl(path, 60 * 60);
    return signed?.signedUrl ?? null;
  }

  const [logo_url, logo_dark_url, stamp_url] = await Promise.all([sign(s.logo_path), sign(s.logo_dark_path), sign(s.stamp_path)]);

  return { ...s, logo_url, logo_dark_url, stamp_url };
}
