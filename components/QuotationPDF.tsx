// Quotation PDF — same layout as InvoicePDF, minus signature/stamp/photos.
import {
  Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";

const RED = "#c8102e";
const BLACK = "#000";
const GREY = "#666";

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: "Helvetica", fontSize: 9, color: BLACK },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logoBox: { width: 120, height: 60, justifyContent: "center", alignItems: "center" },
  logoImg: { width: 120, height: 60, objectFit: "contain" },
  centerCol: { alignItems: "center", justifyContent: "flex-start", flex: 1, paddingHorizontal: 6 },
  centerBold: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  redText: { color: RED, fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 3 },
  rightCol: { alignItems: "flex-end" },
  companyName: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  small: { fontSize: 8, color: GREY, textAlign: "right" },
  contractLabel: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 6 },
  receiptNoLine: { flexDirection: "row", marginTop: 2 },
  receiptNoLabel: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  receiptNoVal: { color: RED, fontFamily: "Helvetica-Bold", fontSize: 10, marginLeft: 4 },

  hr: { borderBottomWidth: 1, borderBottomColor: BLACK, marginVertical: 8 },

  customerGrid: { flexDirection: "row", marginTop: 4 },
  customerCol: { flex: 1, paddingRight: 8 },
  cField: {
    flexDirection: "row",
    borderBottomWidth: 0.5, borderBottomColor: BLACK,
    marginBottom: 6, paddingBottom: 2,
  },
  cLabel: { fontFamily: "Helvetica-Bold" },
  cValue: { marginLeft: 4, flex: 1 },

  table: { borderWidth: 1, borderColor: BLACK, marginTop: 10 },
  tRow: { flexDirection: "row" },
  tHead: { backgroundColor: "#f0f0f0", fontFamily: "Helvetica-Bold" },
  tCell: { padding: 5, borderRightWidth: 1, borderRightColor: BLACK, borderBottomWidth: 1, borderBottomColor: BLACK },
  tCellLast: { padding: 5, borderBottomWidth: 1, borderBottomColor: BLACK },
  cCode: { width: 60 },
  cDesc: { flex: 1 },
  cUnit: { width: 70, textAlign: "right" },
  cTotal: { width: 70, textAlign: "right" },

  summary: { marginTop: 6, marginLeft: "auto", width: 250 },
  sRow: {
    flexDirection: "row", justifyContent: "space-between",
    borderBottomWidth: 0.5, borderBottomColor: BLACK,
    paddingVertical: 3,
  },
  sLabel: { fontFamily: "Helvetica-Bold" },
  grandRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    borderWidth: 1, borderColor: BLACK,
    padding: 6, marginTop: 2,
  },
  grandLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  grandVal: { fontFamily: "Helvetica-Bold", fontSize: 11 },

  footerRow: { flexDirection: "row", marginTop: 20 },
  tcCol: { flex: 1, paddingRight: 12 },
  qrCol: { width: 180, alignItems: "center" },
  tcTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 4 },
  tcBullet: { flexDirection: "row", marginBottom: 2 },
  tcDot: { width: 8, textAlign: "center" },
  tcTxt: { fontSize: 8, flex: 1 },
  qrTxt: { fontSize: 8, textAlign: "center" },

  notesTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 12 },
  notesTxt: { fontSize: 8, marginTop: 3 },

  validity: { fontSize: 8, color: GREY, marginTop: 20, textAlign: "center" },
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
        {/* HEADER — same as invoice */}
        <View style={styles.headerRow}>
          <View style={styles.logoBox}>
            <Image src="/invoice-logo.png" style={styles.logoImg} />
          </View>

          <View style={styles.centerCol}>
            <Text style={styles.centerBold}>WHATSAPP US @ 8757 3360 / 9340 1360</Text>
            <Text style={styles.redText}>QUOTATION</Text>
            <Text style={[styles.redText, { fontSize: 9, marginTop: 1 }]}>
              GST Registration No. 202212959Z
            </Text>
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.companyName}>360 INTEGRATED FM & SM PTE. LTD.</Text>
            <Text style={styles.small}>
              71 Bukit Batok Crescent #06-11 Prestige Centre, Singapore 658071
            </Text>
            <Text style={styles.small}>Email: enquiries@360integrated.com.sg</Text>
            <Text style={styles.small}>Website: www.360integrated.com.sg</Text>
            <Text style={styles.contractLabel}>Quotation</Text>
            <View style={styles.receiptNoLine}>
              <Text style={styles.receiptNoLabel}>Quotation No.</Text>
              <Text style={styles.receiptNoVal}>{q.quotation_no}</Text>
            </View>
          </View>
        </View>

        <View style={styles.hr} />

        {/* CUSTOMER DETAILS */}
        <View style={styles.customerGrid}>
          <View style={styles.customerCol}>
            <View style={styles.cField}>
              <Text style={styles.cLabel}>Customer M/s:</Text>
              <Text style={styles.cValue}>{q.customer_name}</Text>
            </View>
            <View style={styles.cField}>
              <Text style={styles.cLabel}>Address:</Text>
              <Text style={styles.cValue}>{q.customer_address ?? ""}</Text>
            </View>
          </View>

          <View style={styles.customerCol}>
            <View style={styles.cField}>
              <Text style={styles.cLabel}>Date:</Text>
              <Text style={styles.cValue}>{q.quotation_date}</Text>
            </View>
            {q.valid_until && (
              <View style={styles.cField}>
                <Text style={styles.cLabel}>Valid Until:</Text>
                <Text style={styles.cValue}>{q.valid_until}</Text>
              </View>
            )}
            <View style={styles.cField}>
              <Text style={styles.cLabel}>Contact No:</Text>
              <Text style={styles.cValue}>{q.contact_no ?? ""}</Text>
            </View>
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View style={styles.table}>
          <View style={[styles.tRow, styles.tHead]}>
            <Text style={[styles.tCell, styles.cCode]}>Code/No</Text>
            <Text style={[styles.tCell, styles.cDesc]}>Description</Text>
            <Text style={[styles.tCell, styles.cUnit]}>Unit $</Text>
            <Text style={[styles.tCellLast, styles.cTotal]}>Total $</Text>
          </View>

          {q.items.map((it, i) => (
            <View style={styles.tRow} key={i}>
              <Text style={[styles.tCell, styles.cCode]}>{String(i + 1).padStart(3, "0")}</Text>
              <Text style={[styles.tCell, styles.cDesc]}>{it.description}</Text>
              <Text style={[styles.tCell, styles.cUnit]}>{money(it.unit_price)}</Text>
              <Text style={[styles.tCellLast, styles.cTotal]}>{money(it.unit_price)}</Text>
            </View>
          ))}

          {Array.from({ length: Math.max(0, 6 - q.items.length) }).map((_, i) => (
            <View style={styles.tRow} key={`pad-${i}`}>
              <Text style={[styles.tCell, styles.cCode]}> </Text>
              <Text style={[styles.tCell, styles.cDesc]}> </Text>
              <Text style={[styles.tCell, styles.cUnit]}> </Text>
              <Text style={[styles.tCellLast, styles.cTotal]}> </Text>
            </View>
          ))}
        </View>

        {/* SUMMARY */}
        <View style={styles.summary}>
          {q.discount > 0 && (
            <View style={styles.sRow}>
              <Text style={styles.sLabel}>Discount</Text>
              <Text>({money(q.discount)})</Text>
            </View>
          )}
          <View style={styles.sRow}>
            <Text style={styles.sLabel}>Sub-Total</Text>
            <Text>{money(q.subtotal)}</Text>
          </View>
          {q.gst_amount > 0 && (
            <View style={styles.sRow}>
              <Text style={styles.sLabel}>GST</Text>
              <Text>{money(q.gst_amount)}</Text>
            </View>
          )}
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandVal}>S$ {money(q.grand_total)}</Text>
          </View>
        </View>

        {/* NOTES + TERMS */}
        <View style={styles.footerRow}>
          <View style={styles.tcCol}>
            <Text style={styles.tcTitle}>Terms &amp; Conditions</Text>
            {[
              "This quotation is valid for 30 days from the date of issue",
              "30% deposit payable upon confirmation of works order",
              "Balance amount payable upon completion of works order",
              "Prices are subject to change without prior notice after validity period",
            ].map((b, i) => (
              <View style={styles.tcBullet} key={i}>
                <Text style={styles.tcDot}>•</Text>
                <Text style={styles.tcTxt}>{b}</Text>
              </View>
            ))}
          </View>

          <View style={styles.qrCol}>
            <Text style={styles.qrTxt}>
              We accept only Paynow to UEN 202212959Z or QR Code
            </Text>
            <Text style={[styles.qrTxt, { fontFamily: "Helvetica-Bold", marginTop: 2 }]}>
              Practice cashless transaction
            </Text>
          </View>
        </View>

        {q.notes && (
          <View>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesTxt}>{q.notes}</Text>
          </View>
        )}

        <Text style={styles.validity}>
          Thank you for your enquiry. We look forward to serving you.
        </Text>
      </Page>
    </Document>
  );
}
