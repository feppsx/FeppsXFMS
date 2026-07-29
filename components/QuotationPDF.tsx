// Quotation PDF — same skin as invoice, minus signatures/stamp.
import {
  Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";

const RED   = "#9A121A";
const BLUE  = "#003882";
const INFO  = "#E3ECF6";
const BLACK = "#000";
const LIGHT = "#f5f5f5";

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", fontSize: 9, color: BLACK },

  header: { backgroundColor: RED, padding: 22, paddingBottom: 30, color: "white" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logoBox: { width: 96, height: 44, backgroundColor: "white", borderRadius: 4, alignItems: "center", justifyContent: "center" },
  logoImg: { width: 90, height: 40, objectFit: "contain" },
  centerCol: { flex: 1, alignItems: "center", paddingHorizontal: 6 },
  whatsapp: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  titleTxt: { fontFamily: "Helvetica-Bold", fontSize: 15, letterSpacing: 1, marginTop: 4 },
  gstTxt:   { fontSize: 8, opacity: 0.92, marginTop: 2 },
  rightCol: { alignItems: "flex-end", minWidth: 130 },
  companyName: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  address: { fontSize: 8, marginTop: 2, textAlign: "right", opacity: 0.9 },

  numberPill: {
    marginHorizontal: 24, marginTop: -14, backgroundColor: "white",
    borderRadius: 8, padding: 8, paddingHorizontal: 14,
    flexDirection: "row", justifyContent: "space-between",
    borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  numberLabel: { fontFamily: "Helvetica-Bold", fontSize: 10, color: BLUE },
  numberVal:   { fontFamily: "Helvetica-Bold", fontSize: 10, color: RED },

  body: { padding: 24, paddingTop: 18 },

  infoCard: { backgroundColor: INFO, borderRadius: 10, padding: 10 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoCell: { width: "50%", flexDirection: "row", marginBottom: 4, paddingRight: 8 },
  infoLabel: { color: "#64748b", fontSize: 9 },
  infoVal:   { color: BLACK, fontSize: 9, marginLeft: 4, flex: 1 },

  table: { marginTop: 12, borderRadius: 8, overflow: "hidden", borderWidth: 0.5, borderColor: "#e5e7eb" },
  tHead: { flexDirection: "row", backgroundColor: RED },
  th: { color: "white", padding: 6, fontFamily: "Helvetica-Bold", fontSize: 9 },
  tRow: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: "#e5e7eb" },
  tRowAlt: { backgroundColor: LIGHT },
  td: { padding: 6, fontSize: 9 },
  cCode:  { width: 55 },
  cDesc:  { flex: 1 },
  cUnit:  { width: 70, textAlign: "right" },
  cTotal: { width: 70, textAlign: "right" },
  monoR: { textAlign: "right" },

  summaryWrap: { alignItems: "flex-end", marginTop: 12 },
  summary: { width: 260 },
  sRow: {
    flexDirection: "row", justifyContent: "space-between",
    padding: 4, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#cccccc",
  },
  sLabel: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  grandRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: BLUE, color: "white", borderRadius: 8,
    padding: 10, paddingHorizontal: 14, marginTop: 6,
  },
  grandLbl: { color: "white", fontFamily: "Helvetica-Bold", fontSize: 10 },
  grandVal: { color: "white", fontFamily: "Helvetica-Bold", fontSize: 11 },

  footerRow: { flexDirection: "row", marginTop: 18, gap: 12 },
  tcCol: { flex: 1, backgroundColor: INFO, borderRadius: 8, padding: 10 },
  qrCol: { width: 150, backgroundColor: INFO, borderRadius: 8, padding: 10, alignItems: "center" },
  tcTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: BLUE, marginBottom: 3 },
  tcBullet: { flexDirection: "row", marginBottom: 1 },
  tcDot: { width: 8, textAlign: "center", fontSize: 8 },
  tcTxt: { fontSize: 8, flex: 1 },
  qrTxt: { fontSize: 7, textAlign: "center", color: BLUE, fontFamily: "Helvetica-Bold", marginTop: 4 },
  qrPlaceholder: { width: 80, height: 80, backgroundColor: "white", borderRadius: 4 },

  notesTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: BLUE, marginTop: 12 },
  notesTxt:   { fontSize: 8, marginTop: 3 },

  thanks: { textAlign: "center", color: BLUE, fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 20 },
});

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface QuotationPdfInput {
  quotation_no: string;
  quotation_date: string;
  valid_until: string | null;
  customer_name: string;
  customer_address: string | null;
  contact_no: string | null;
  subtotal: number;
  discount: number;
  gst_amount: number;
  grand_total: number;
  notes: string | null;
  items: { description: string; unit_price: number }[];
}

export function QuotationPDF({ q }: { q: QuotationPdfInput }) {
  return (
    <Document title={q.quotation_no}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoBox}>
              <Image src="/invoice-logo.png" style={styles.logoImg} />
            </View>
            <View style={styles.centerCol}>
              <Text style={styles.whatsapp}>WHATSAPP US @ 8757 3360 / 9340 1360</Text>
              <Text style={styles.titleTxt}>QUOTATION</Text>
              <Text style={styles.gstTxt}>GST Registration No. 202212959Z</Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.companyName}>360 INTEGRATED FM & SM PTE. LTD.</Text>
              <Text style={styles.address}>71 Bukit Batok Cres #06-11{"\n"}Prestige Centre, Singapore</Text>
            </View>
          </View>
        </View>

        <View style={styles.numberPill}>
          <Text style={styles.numberLabel}>Quotation No.</Text>
          <Text style={styles.numberVal}>{q.quotation_no}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Customer:</Text>
                <Text style={styles.infoVal}>{q.customer_name}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoVal}>{q.quotation_date}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoVal}>{q.customer_address ?? ""}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Contact:</Text>
                <Text style={styles.infoVal}>{q.contact_no ?? ""}</Text>
              </View>
              {q.valid_until && (
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Valid until:</Text>
                  <Text style={styles.infoVal}>{q.valid_until}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tHead}>
              <Text style={[styles.th, styles.cCode]}>Code</Text>
              <Text style={[styles.th, styles.cDesc]}>Description</Text>
              <Text style={[styles.th, styles.cUnit]}>Unit $</Text>
              <Text style={[styles.th, styles.cTotal]}>Total $</Text>
            </View>
            {q.items.map((it, i) => (
              <View style={[styles.tRow, i % 2 === 1 ? styles.tRowAlt : {}]} key={i}>
                <Text style={[styles.td, styles.cCode]}>{String(i + 1).padStart(3, "0")}</Text>
                <Text style={[styles.td, styles.cDesc]}>{it.description}</Text>
                <Text style={[styles.td, styles.cUnit]}>{money(it.unit_price)}</Text>
                <Text style={[styles.td, styles.cTotal]}>{money(it.unit_price)}</Text>
              </View>
            ))}
            {Array.from({ length: Math.max(0, 4 - q.items.length) }).map((_, i) => (
              <View style={[styles.tRow, (q.items.length + i) % 2 === 1 ? styles.tRowAlt : {}]} key={`pad-${i}`}>
                <Text style={[styles.td, styles.cCode]}> </Text>
                <Text style={[styles.td, styles.cDesc]}> </Text>
                <Text style={[styles.td, styles.cUnit]}> </Text>
                <Text style={[styles.td, styles.cTotal]}> </Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryWrap}>
            <View style={styles.summary}>
              <View style={styles.sRow}>
                <Text style={styles.sLabel}>Sub-Total</Text>
                <Text style={styles.monoR}>{money(q.subtotal)}</Text>
              </View>
              {q.discount > 0 && (
                <View style={styles.sRow}>
                  <Text style={styles.sLabel}>Discount</Text>
                  <Text style={styles.monoR}>({money(q.discount)})</Text>
                </View>
              )}
              {q.gst_amount > 0 && (
                <View style={styles.sRow}>
                  <Text style={styles.sLabel}>GST</Text>
                  <Text style={styles.monoR}>{money(q.gst_amount)}</Text>
                </View>
              )}
              <View style={styles.grandRow}>
                <Text style={styles.grandLbl}>Grand Total</Text>
                <Text style={styles.grandVal}>S$ {money(q.grand_total)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.tcCol}>
              <Text style={styles.tcTitle}>Terms &amp; Conditions</Text>
              {[
                "This quotation is valid for 30 days from the date of issue.",
                "30% deposit payable upon confirmation of works order.",
                "Balance amount payable upon completion of works order.",
                "Prices subject to change without prior notice after validity period.",
              ].map((b, i) => (
                <View style={styles.tcBullet} key={i}>
                  <Text style={styles.tcDot}>•</Text>
                  <Text style={styles.tcTxt}>{b}</Text>
                </View>
              ))}
            </View>
            <View style={styles.qrCol}>
              <View style={styles.qrPlaceholder} />
              <Text style={styles.qrTxt}>Paynow UEN 202212959Z</Text>
            </View>
          </View>

          {q.notes && (
            <View>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesTxt}>{q.notes}</Text>
            </View>
          )}

          <Text style={styles.thanks}>Thank you for your enquiry. We look forward to serving you.</Text>
        </View>
      </Page>
    </Document>
  );
}
