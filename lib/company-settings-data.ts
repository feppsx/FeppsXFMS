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
  const { data } = await supabase
    .from("company_settings")
    .select("*")
    .limit(1)
    .maybeSingle<CompanySettings>();

  const fallback: CompanySettings = {
    id: "",
    logo_path: null,
    logo_dark_path: null,
    stamp_path: null,
    company_name: "360 INTEGRATED FM & SM PTE. LTD.",
    tagline: "Facilities Management & Strata Management is our Key",
    uen: "202212959Z",
    gst_reg: "202212959Z",
    address_line: "71 Bukit Batok Cres #06-11 Prestige Centre, Singapore 658071",
    phone_office: "6677 0360",
    phone_hotline: "8757 3360 / 8758 3360",
    phone_whatsapp: "8757 3360 / 9340 1360",
    email: "support@360maintenance.sg",
    website: "www.360maintenance.sg",
    badges_line: "bizSAFE · STR · LAS · TOP Prestige 100",
    invoice_terms:
      "30% deposit payable upon confirmation of works order\nBalance amount payable upon completion of works order\nDeposit non-refundable if order cancelled after confirmation\nGoods delivered are not returnable & sold are not exchangeable",
    quotation_terms:
      "This quotation is valid for 30 days from the date of issue.\n30% deposit payable upon confirmation of works order.\nBalance amount payable upon completion of works order.\nPrices subject to change without prior notice after validity period.",
    paynow_text: "Paynow UEN 202212959Z",
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
