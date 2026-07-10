// FM Division Service Report — A4 fillable form PDF, matches the corporate spec.
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const BLACK = "#000";
const GREY = "#666";
const BRAND = "#0f4c81";
const LIGHT = "#f5f5f5";

const s = StyleSheet.create({
  page: { padding: 20, fontFamily: "Helvetica", fontSize: 9, color: BLACK },

  // Header
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1.5, borderBottomColor: BLACK, paddingBottom: 6 },
  brandBlock: { flex: 1 },
  brandLogo: { fontFamily: "Helvetica-Bold", fontSize: 13, color: BRAND, letterSpacing: 1 },
  companyName: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 2 },
  tagline: { fontSize: 8, color: GREY, fontStyle: "italic", marginTop: 1 },
  uen: { fontSize: 8, color: GREY, marginTop: 1 },
  snBlock: { alignItems: "flex-end" },
  snLabel: { fontSize: 8, color: GREY },
  snVal: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#c8102e", marginTop: 1 },

  titleBar: { backgroundColor: BRAND, padding: 6, marginVertical: 8, textAlign: "center" },
  titleText: { color: "white", fontFamily: "Helvetica-Bold", fontSize: 12, letterSpacing: 1 },

  // Section: project & contact
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, backgroundColor: LIGHT, padding: 4, borderWidth: 0.5, borderColor: BLACK, marginTop: 4 },
  gridBox: { borderWidth: 0.5, borderColor: BLACK, borderTopWidth: 0 },
  gridRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BLACK },
  gridRowLast: { flexDirection: "row" },
  gridCell: { flex: 1, padding: 4, borderRightWidth: 0.5, borderRightColor: BLACK },
  gridCellLast: { flex: 1, padding: 4 },
  fieldLabel: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  fieldValue: { fontSize: 9, marginTop: 2, minHeight: 10 },

  // checkbox row
  checkRow: { flexDirection: "row", flexWrap: "wrap", padding: 4 },
  checkItem: { flexDirection: "row", alignItems: "center", marginRight: 12, marginVertical: 2 },
  chkBox: { width: 9, height: 9, borderWidth: 0.7, borderColor: BLACK, marginRight: 4, alignItems: "center", justifyContent: "center" },
  chkMark: { fontFamily: "Helvetica-Bold", fontSize: 7 },
  chkLabel: { fontSize: 8 },

  // large text boxes
  bigBox: { borderWidth: 0.5, borderColor: BLACK, borderTopWidth: 0, padding: 6, minHeight: 90 },

  // sign-off
  signRow: { flexDirection: "row", marginTop: 8, gap: 6 },
  signCol: { flex: 1, borderWidth: 0.5, borderColor: BLACK, padding: 6 },
  signField: { flexDirection: "row", marginBottom: 8 },
  signLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, width: 90 },
  signValue: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: BLACK, fontSize: 8, paddingBottom: 1 },

  // footer
  disclaimer: { marginTop: 10, fontSize: 7, textAlign: "center", fontStyle: "italic", color: BLACK },
  contact: { marginTop: 6, fontSize: 6.5, textAlign: "center", color: GREY },
  logoBadges: { marginTop: 4, fontSize: 7, textAlign: "center", fontFamily: "Helvetica-Bold", color: BRAND, letterSpacing: 1 },
});

function Chk({ on }: { on: boolean }) {
  return (
    <View style={s.chkBox}>
      {on ? <Text style={s.chkMark}>x</Text> : null}
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

export function ServiceReportPDF({ sr }: { sr: ServiceReportPdfInput }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.brandBlock}>
            <Text style={s.brandLogo}>FM 360 SM</Text>
            <Text style={s.companyName}>360 INTEGRATED FM & SM PTE LTD</Text>
            <Text style={s.tagline}>Facilities Management & Strata Management is our Key</Text>
            <Text style={s.uen}>UEN No: 202212959Z</Text>
          </View>
          <View style={s.snBlock}>
            <Text style={s.snLabel}>SN NO:</Text>
            <Text style={s.snVal}>{sr.sr_no}</Text>
          </View>
        </View>

        {/* Title bar */}
        <View style={s.titleBar}>
          <Text style={s.titleText}>FM DIVISION SERVICE REPORT</Text>
        </View>

        {/* Project & Contact */}
        <Text style={s.sectionTitle}>PROJECT & CONTACT INFORMATION</Text>
        <View style={s.gridBox}>
          <View style={s.gridRow}>
            <View style={s.gridCell}>
              <Text style={s.fieldLabel}>Name / Project :</Text>
              <Text style={s.fieldValue}>{sr.project_name}</Text>
            </View>
            <View style={s.gridCellLast}>
              <Text style={s.fieldLabel}>Contact Person :</Text>
              <Text style={s.fieldValue}>{sr.contact_person ?? ""}</Text>
            </View>
          </View>
          <View style={s.gridRow}>
            <View style={s.gridCell}>
              <Text style={s.fieldLabel}>Service Address :</Text>
              <Text style={s.fieldValue}>{sr.service_address ?? ""}</Text>
            </View>
            <View style={s.gridCellLast}>
              <Text style={s.fieldLabel}>Contact No :</Text>
              <Text style={s.fieldValue}>{sr.contact_no ?? ""}</Text>
            </View>
          </View>
          <View style={s.gridRowLast}>
            <View style={[s.checkRow, { flex: 1 }]}>
              <View style={s.checkItem}><Chk on={sr.is_term_agreement} /><Text style={s.chkLabel}>Term Agreement/MCST</Text></View>
              <View style={s.checkItem}><Chk on={sr.is_on_call} /><Text style={s.chkLabel}>On Call / Site Visit</Text></View>
              <View style={s.checkItem}><Chk on={sr.is_contract} /><Text style={s.chkLabel}>Contract</Text></View>
              <View style={s.checkItem}><Chk on={sr.is_chargeable} /><Text style={s.chkLabel}>Chargeable</Text></View>
            </View>
          </View>
        </View>

        {/* Service Rendered */}
        <Text style={s.sectionTitle}>SERVICE RENDERED (Routine / Complaints / Feedback)</Text>
        <View style={[s.gridBox, s.checkRow]}>
          <View style={s.checkItem}><Chk on={sr.svc_electrical} /><Text style={s.chkLabel}>Electrical</Text></View>
          <View style={s.checkItem}><Chk on={sr.svc_plumbing} /><Text style={s.chkLabel}>Plumbing</Text></View>
          <View style={s.checkItem}><Chk on={sr.svc_generator} /><Text style={s.chkLabel}>Generator</Text></View>
          <View style={s.checkItem}><Chk on={sr.svc_pump} /><Text style={s.chkLabel}>Pump</Text></View>
          <View style={s.checkItem}><Chk on={sr.svc_fire_panel} /><Text style={s.chkLabel}>Fire Panel</Text></View>
          <View style={s.checkItem}><Chk on={sr.svc_intercom} /><Text style={s.chkLabel}>Intercom</Text></View>
          <View style={s.checkItem}><Chk on={sr.svc_cctv} /><Text style={s.chkLabel}>CCTV</Text></View>
          <View style={s.checkItem}><Chk on={sr.svc_lighting} /><Text style={s.chkLabel}>Lighting</Text></View>
          <View style={s.checkItem}><Chk on={sr.svc_auto_door} /><Text style={s.chkLabel}>Auto-Door</Text></View>
          <View style={s.checkItem}><Chk on={!!sr.svc_others} /><Text style={s.chkLabel}>Others: {sr.svc_others ?? ""}</Text></View>
        </View>

        {/* Work Description */}
        <Text style={s.sectionTitle}>WORK DESCRIPTION</Text>
        <View style={s.bigBox}>
          <Text>{sr.work_description ?? ""}</Text>
        </View>

        {/* Recommendation */}
        <Text style={s.sectionTitle}>RECOMMENDATION</Text>
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
              <Text style={s.signValue}></Text>
            </View>
          </View>
          <View style={s.signCol}>
            <View style={s.signField}>
              <Text style={s.signLabel}>Service Attended By:</Text>
              <Text style={s.signValue}>{sr.service_attended_by ?? ""}</Text>
            </View>
            <View style={s.signField}>
              <Text style={s.signLabel}>Date Attended:</Text>
              <Text style={s.signValue}>{sr.date_attended ?? ""}</Text>
            </View>
            <View style={s.signField}>
              <Text style={s.signLabel}>Time In:</Text>
              <Text style={s.signValue}>{sr.time_in ?? ""}</Text>
            </View>
            <View style={s.signField}>
              <Text style={s.signLabel}>Time Out:</Text>
              <Text style={s.signValue}>{sr.time_out ?? ""}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={s.disclaimer}>
          Please do not hesitate to call us and check the work before signing. Payments are made to 360 Integrated FM & SM Pte Ltd only.
        </Text>
        <Text style={s.contact}>
          No. 71 Bukit Batok Crescent, #06-11 Prestige Centre, Singapore 658071  |  Tel: 6677 0360 (O)  |  Hotline: 8757 3360 / 8758 3360  |  support@360maintenance.sg  |  www.360maintenance.sg
        </Text>
        <Text style={s.logoBadges}>bizSAFE  ·  STR  ·  LAS  ·  TOP Prestige 100</Text>
      </Page>
    </Document>
  );
}
