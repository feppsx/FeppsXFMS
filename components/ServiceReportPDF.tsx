// Service Report PDF — red header, blue title bar, light-blue info + sign-off cards.
import { Document, Page, View, Text, Image, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import type { CompanyBranding } from "@/lib/company-settings-data";

const RED   = "#9A121A";
const BLUE  = "#003882";
const INFO  = "#E3ECF6";
const BLACK = "#000";
const GREY  = "#666";

const s = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", fontSize: 9, color: BLACK },

  header: { backgroundColor: RED, padding: 22, paddingBottom: 22, color: "white" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandBlock: { flexDirection: "column" },
  logoBox: { width: 96, height: 44, backgroundColor: "white", borderRadius: 4, alignItems: "center", justifyContent: "center" },
  logoImg: { width: 90, height: 40, objectFit: "contain" },
  companyName: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 6 },
  tagline: { fontSize: 8, opacity: 0.9 },
  uen: { fontSize: 8, opacity: 0.9 },
  snBlock: { alignItems: "flex-end" },
  snLabel: { fontSize: 8, opacity: 0.85 },
  snPill: {
    backgroundColor: "white", borderRadius: 6, padding: 5, paddingHorizontal: 10, marginTop: 4,
    color: RED, fontFamily: "Helvetica-Bold", fontSize: 11,
  },

  titleBar: { backgroundColor: BLUE, padding: 8, textAlign: "center" },
  titleTxt: { color: "white", fontFamily: "Helvetica-Bold", fontSize: 12, letterSpacing: 1.5 },

  body: { padding: 20 },

  sectionLbl: { fontFamily: "Helvetica-Bold", fontSize: 9, color: BLUE, marginTop: 8, marginBottom: 4, letterSpacing: 0.5 },

  infoCard: { backgroundColor: INFO, borderRadius: 10, padding: 10 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoCell: { width: "50%", flexDirection: "row", marginBottom: 4, paddingRight: 8 },
  infoLabel: { color: "#64748b", fontSize: 9 },
  infoVal:   { color: BLACK, fontSize: 9, marginLeft: 4, flex: 1 },

  // Checkbox row (used inside info card and services)
  chkRow: { flexDirection: "row", flexWrap: "wrap", paddingTop: 8, marginTop: 6, borderTopWidth: 0.5, borderTopColor: "#cbd5e1" },
  chkItem: { flexDirection: "row", alignItems: "center", marginRight: 12, marginVertical: 2 },
  chkBoxOn: {
    width: 10, height: 10, backgroundColor: BLUE, borderRadius: 2, marginRight: 4,
    alignItems: "center", justifyContent: "center",
  },
  chkBoxOff: {
    width: 10, height: 10, backgroundColor: "white", borderWidth: 0.7, borderColor: BLACK,
    borderRadius: 2, marginRight: 4,
  },
  chkTick: { color: "white", fontSize: 8, fontFamily: "Helvetica-Bold", lineHeight: 1 },
  chkLabel: { fontSize: 8 },

  // Services box
  svcBox: { backgroundColor: INFO, borderRadius: 10, padding: 10, flexDirection: "row", flexWrap: "wrap" },

  // Bordered white cards for descriptions
  bigBox: {
    borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "white",
    borderRadius: 10, padding: 10, minHeight: 72,
  },

  // Sign-off cards
  signRow: { flexDirection: "row", marginTop: 10, gap: 8 },
  signCol: { flex: 1, backgroundColor: INFO, borderRadius: 10, padding: 10 },
  signField: { flexDirection: "row", marginBottom: 6 },
  signLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#64748b", width: 90 },
  signValue: { flex: 1, fontSize: 9 },
  sigLine: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: BLACK, fontSize: 8, paddingBottom: 1 },

  disclaimer: { marginTop: 12, fontSize: 7, textAlign: "center", fontStyle: "italic", color: GREY },
  contact:    { marginTop: 4, fontSize: 6.5, textAlign: "center", color: GREY },
  badges:     { marginTop: 4, fontSize: 7, textAlign: "center", fontFamily: "Helvetica-Bold", color: BLUE, letterSpacing: 1 },
});

function Chk({ on }: { on: boolean }) {
  if (!on) return <View style={s.chkBoxOff} />;
  return (
    <View style={s.chkBoxOn}>
      <Svg width={8} height={8} viewBox="0 0 24 24">
        <Path d="M5 12.5 L10 17.5 L19 6" stroke="white" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export interface ServiceReportPdfInput {
  sr_no: string;
  project_name: string;
  service_address: string | null;
  contact_person: string | null;
  contact_no: string | null;
  is_term_agreement: boolean;
  is_on_call: boolean;
  is_contract: boolean;
  is_chargeable: boolean;
  svc_electrical: boolean;
  svc_plumbing: boolean;
  svc_generator: boolean;
  svc_pump: boolean;
  svc_fire_panel: boolean;
  svc_intercom: boolean;
  svc_cctv: boolean;
  svc_lighting: boolean;
  svc_auto_door: boolean;
  svc_others: string | null;
  work_description: string | null;
  recommendation: string | null;
  customer_name: string | null;
  service_attended_by: string | null;
  date_attended: string | null;
  time_in: string | null;
  time_out: string | null;
}

export function ServiceReportPDF({ sr, branding }: { sr: ServiceReportPdfInput; branding?: CompanyBranding | null }) {
  const b = branding ?? null;
  const logoSrc = b?.logo_url || "/invoice-logo.png";
  const companyName = b?.company_name || "Your Company Name";
  const tagline = b?.tagline || "";
  const uen = b?.uen || "";
  const address = b?.address_line || "";
  const officePhone = b?.phone_office || "";
  const hotline = b?.phone_hotline || "";
  const email = b?.email || "";
  const badges = b?.badges_line || "";
  return (
    <Document title={sr.sr_no}>
      <Page size="A4" style={s.page}>
        {/* Red header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.brandBlock}>
              <View style={s.logoBox}>
                <Image src={logoSrc} style={s.logoImg} />
              </View>
              <Text style={s.companyName}>{companyName}</Text>
              <Text style={s.tagline}>{tagline}</Text>
              <Text style={s.uen}>UEN No: {uen}</Text>
            </View>
            <View style={s.snBlock}>
              <Text style={s.snLabel}>SN NO</Text>
              <Text style={s.snPill}>{sr.sr_no}</Text>
            </View>
          </View>
        </View>

        {/* Blue title bar */}
        <View style={s.titleBar}>
          <Text style={s.titleTxt}>FM DIVISION SERVICE REPORT</Text>
        </View>

        <View style={s.body}>
          {/* Project & Contact info */}
          <Text style={s.sectionLbl}>PROJECT & CONTACT INFORMATION</Text>
          <View style={s.infoCard}>
            <View style={s.infoGrid}>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Name / Project:</Text>
                <Text style={s.infoVal}>{sr.project_name}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Contact Person:</Text>
                <Text style={s.infoVal}>{sr.contact_person ?? ""}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Service Address:</Text>
                <Text style={s.infoVal}>{sr.service_address ?? ""}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Contact No:</Text>
                <Text style={s.infoVal}>{sr.contact_no ?? ""}</Text>
              </View>
            </View>
            <View style={s.chkRow}>
              <View style={s.chkItem}><Chk on={sr.is_term_agreement} /><Text style={s.chkLabel}>Term Agreement / MCST</Text></View>
              <View style={s.chkItem}><Chk on={sr.is_on_call} /><Text style={s.chkLabel}>On Call / Site Visit</Text></View>
              <View style={s.chkItem}><Chk on={sr.is_contract} /><Text style={s.chkLabel}>Contract</Text></View>
              <View style={s.chkItem}><Chk on={sr.is_chargeable} /><Text style={s.chkLabel}>Chargeable</Text></View>
            </View>
          </View>

          {/* Services rendered */}
          <Text style={s.sectionLbl}>SERVICE RENDERED (Routine / Complaints / Feedback)</Text>
          <View style={s.svcBox}>
            <View style={s.chkItem}><Chk on={sr.svc_electrical} /><Text style={s.chkLabel}>Electrical</Text></View>
            <View style={s.chkItem}><Chk on={sr.svc_plumbing} /><Text style={s.chkLabel}>Plumbing</Text></View>
            <View style={s.chkItem}><Chk on={sr.svc_generator} /><Text style={s.chkLabel}>Generator</Text></View>
            <View style={s.chkItem}><Chk on={sr.svc_pump} /><Text style={s.chkLabel}>Pump</Text></View>
            <View style={s.chkItem}><Chk on={sr.svc_fire_panel} /><Text style={s.chkLabel}>Fire Panel</Text></View>
            <View style={s.chkItem}><Chk on={sr.svc_intercom} /><Text style={s.chkLabel}>Intercom</Text></View>
            <View style={s.chkItem}><Chk on={sr.svc_cctv} /><Text style={s.chkLabel}>CCTV</Text></View>
            <View style={s.chkItem}><Chk on={sr.svc_lighting} /><Text style={s.chkLabel}>Lighting</Text></View>
            <View style={s.chkItem}><Chk on={sr.svc_auto_door} /><Text style={s.chkLabel}>Auto-Door</Text></View>
            <View style={s.chkItem}><Chk on={!!sr.svc_others} /><Text style={s.chkLabel}>Others: {sr.svc_others ?? ""}</Text></View>
          </View>

          {/* Work Description */}
          <Text style={s.sectionLbl}>WORK DESCRIPTION</Text>
          <View style={s.bigBox}>
            <Text>{sr.work_description ?? ""}</Text>
          </View>

          {/* Recommendation */}
          <Text style={s.sectionLbl}>RECOMMENDATION</Text>
          <View style={s.bigBox}>
            <Text>{sr.recommendation ?? ""}</Text>
          </View>

          {/* Sign-off */}
          <View style={s.signRow}>
            <View style={s.signCol}>
              <View style={s.signField}>
                <Text style={s.signLabel}>Customer Name:</Text>
                <Text style={s.signValue}>{sr.customer_name ?? ""}</Text>
              </View>
              <View style={s.signField}>
                <Text style={s.signLabel}>Signature:</Text>
                <Text style={s.sigLine}></Text>
              </View>
            </View>
            <View style={s.signCol}>
              <View style={s.signField}>
                <Text style={s.signLabel}>Attended By:</Text>
                <Text style={s.signValue}>{sr.service_attended_by ?? ""}</Text>
              </View>
              <View style={s.signField}>
                <Text style={s.signLabel}>Date:</Text>
                <Text style={s.signValue}>{sr.date_attended ?? ""}</Text>
              </View>
              <View style={s.signField}>
                <Text style={s.signLabel}>Time In / Out:</Text>
                <Text style={s.signValue}>{sr.time_in ?? ""} / {sr.time_out ?? ""}</Text>
              </View>
            </View>
          </View>

          <Text style={s.disclaimer}>
            Please do not hesitate to call us and check the work before signing. Payments are made to the company named above only.
          </Text>
          <Text style={s.contact}>
            {address} · Tel: {officePhone} · Hotline: {hotline} · {email}
          </Text>
          <Text style={s.badges}>{badges}</Text>
        </View>
      </Page>
    </Document>
  );
}
