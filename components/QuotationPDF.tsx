// PDF template for Quotation — no signature/stamp.
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const BLACK = "#000";
const GREY = "#666";
const BRAND = "#0f4c81";

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: "Helvetica", fontSize: 9, color: BLACK },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  companyName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: BRAND },
  tagline: { fontSize: 8, color: GREY, marginTop: 2 },
  uen: { fontSize: 8, color: GREY, marginTop: 2 },
  quotTitle: { fontFamily: "Helvetica-Bold", fontSize: 14, textAlign: "right", color: BRAND },
  quotNo: { fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 2 },
  quotDate: { fontSize: 8, color: GREY, textAlign: "right", marginTop: 2 },

  hr: { borderBottomWidth: 1, borderBottomColor: BLACK, marginVertical: 8 },

  custGrid: { flexDirection: "row", marginTop: 4 },
  custCol: { flex: 1, paddingRight: 8 },
  cField: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BLACK, marginBottom: 6, paddingBottom: 2 },
  cLabel: { fontFamily: "Helvetica-Bold" },
  cValue: { marginLeft: 4, flex: 1 },

  table: { borderWidth: 1, borderColor: BLACK, marginTop: 10 },
  tRow: { flexDirection: "row" },
  tHead: { backgroundColor: "#f0f0f0", fontFamily: "Helvetica-Bold" },
  tCell: { padding: 5, borderRightWidth: 1, borderRightColor: BLACK, borderBottomWidth: 1, borderBottomColor: BLACK },
  tCellLast: { padding: 5, borderBottomWidth: 1, borderBottomColor: BLACK },
  cNo: { width: 30 },
  cDesc: { flex: 1 },
  cAmt: { width: 80, textAlign: "right" },

  summary: { marginTop: 6, marginLeft: "auto", width: 240 },
  sRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.5, borderBottomColor: BLACK, paddingVertical: 3 },
  sLabel: { fontFamily: "Helvetica-Bold" },
  grandRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: BLACK,
    padding: 6, marginTop: 2,
  },

  notes: { marginTop: 12, fontSize: 8 },
  notesLabel: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  footer: { position: "absolute", bottom: 20, left: 24, right: 24, textAlign: "center", fontSize: 7, color: GREY },
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
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>360 INTEGRATED FM & SM PTE LTD</Text>
            <Text style={styles.tagline}>Facilities Management & Strata Management is our Key</Text>
            <Text style={styles.uen}>UEN No: 202212959Z</Text>
          </View>
          <View>
            <Text style={styles.quotTitle}>QUOTATION</Text>
            <Text style={styles.quotNo}>No: {q.quotation_no}</Text>
            <Text style={styles.quotDate}>Date: {q.quotation_date}</Text>
            {q.valid_until && <Text style={styles.quotDate}>Valid until: {q.valid_until}</Text>}
          </View>
        </View>

        <View style={styles.hr} />

        {/* Customer */}
        <View style={styles.custGrid}>
          <View style={styles.custCol}>
            <View style={styles.cField}>
              <Text style={styles.cLabel}>To:</Text>
              <Text style={styles.cValue}>{q.customer_name}</Text>
            </View>
            {q.customer_address && (
              <View style={styles.cField}>
                <Text style={styles.cLabel}>Address:</Text>
                <Text style={styles.cValue}>{q.customer_address}</Text>
              </View>
            )}
            {q.contact_no && (
              <View style={styles.cField}>
                <Text style={styles.cLabel}>Contact:</Text>
                <Text style={styles.cValue}>{q.contact_no}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Line items */}
        <View style={styles.table}>
          <View style={[styles.tRow, styles.tHead]}>
            <Text style={[styles.tCell, styles.cNo]}>#</Text>
            <Text style={[styles.tCell, styles.cDesc]}>Description</Text>
            <Text style={[styles.tCellLast, styles.cAmt]}>Amount (S$)</Text>
          </View>
          {q.items.map((it, i) => (
            <View key={i} style={styles.tRow}>
              <Text style={[styles.tCell, styles.cNo]}>{i + 1}</Text>
              <Text style={[styles.tCell, styles.cDesc]}>{it.description}</Text>
              <Text style={[styles.tCellLast, styles.cAmt]}>{money(it.unit_price)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.sRow}>
            <Text style={styles.sLabel}>Subtotal</Text>
            <Text>S$ {money(q.subtotal)}</Text>
          </View>
          {q.discount > 0 && (
            <View style={styles.sRow}>
              <Text style={styles.sLabel}>Discount</Text>
              <Text>-S$ {money(q.discount)}</Text>
            </View>
          )}
          {q.gst_amount > 0 && (
            <View style={styles.sRow}>
              <Text style={styles.sLabel}>GST</Text>
              <Text>S$ {money(q.gst_amount)}</Text>
            </View>
          )}
          <View style={styles.grandRow}>
            <Text style={styles.sLabel}>Grand Total</Text>
            <Text style={styles.sLabel}>S$ {money(q.grand_total)}</Text>
          </View>
        </View>

        {q.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text>{q.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          No. 71 Bukit Batok Crescent, #06-11 Prestige Centre, Singapore 658071  |  Tel: 6677 0360  |  support@360maintenance.sg
        </Text>
      </Page>
    </Document>
  );
}
