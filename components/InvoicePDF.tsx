// Pure PDF template. Renders when handed to @react-pdf/renderer.
// No React DOM here — all children are @react-pdf/renderer primitives.
import {
  Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";
import type { Invoice, InvoiceItem } from "@/lib/db-types";

const RED = "#c8102e";
const BLACK = "#000";
const GREY = "#666";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: BLACK,
  },
  headerRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logoBox: {
    width: 120, height: 60,
    justifyContent: "center", alignItems: "center",
  },
  logoImg: {
    width: 120, height: 60,
    objectFit: "contain",
  },
  centerCol:  { alignItems: "center", justifyContent: "flex-start", flex: 1, paddingHorizontal: 6 },
  centerBold: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  redText:    { color: RED, fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 3 },
  rightCol:   { alignItems: "flex-end" },
  companyName:{ fontSize: 12, fontFamily: "Helvetica-Bold" },
  small:      { fontSize: 8, color: GREY, textAlign: "right" },
  contractLabel: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 6 },
  receiptNoLine: { flexDirection: "row", marginTop: 2 },
  receiptNoLabel:{ fontFamily: "Helvetica-Bold", fontSize: 10 },
  receiptNoVal:  { color: RED, fontFamily: "Helvetica-Bold", fontSize: 10, marginLeft: 4 },

  hr: { borderBottomWidth: 1, borderBottomColor: BLACK, marginVertical: 8 },

  customerGrid: { flexDirection: "row", marginTop: 4 },
  customerCol:  { flex: 1, paddingRight: 8 },
  cField: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BLACK,
    marginBottom: 6,
    paddingBottom: 2,
  },
  cLabel: { fontFamily: "Helvetica-Bold" },
  cValue: { marginLeft: 4, flex: 1 },

  table: {
    borderWidth: 1, borderColor: BLACK, marginTop: 10,
  },
  tRow:   { flexDirection: "row" },
  tHead:  { backgroundColor: "#f0f0f0", fontFamily: "Helvetica-Bold" },
  tCell: { padding: 5, borderRightWidth: 1, borderRightColor: BLACK, borderBottomWidth: 1, borderBottomColor: BLACK },
  tCellLast: { padding: 5, borderBottomWidth: 1, borderBottomColor: BLACK },
  cCode:  { width: 60 },
  cDesc:  { flex: 1 },
  cUnit:  { width: 70, textAlign: "right" },
  cTotal: { width: 70, textAlign: "right" },

  summary: {
    marginTop: 6, marginLeft: "auto",
    width: 250,
  },
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
  grandVal:   { fontFamily: "Helvetica-Bold", fontSize: 11 },

  footerRow: { flexDirection: "row", marginTop: 20 },
  tcCol:     { flex: 1, paddingRight: 12 },
  qrCol:     { width: 180, alignItems: "center" },
  tcTitle:   { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 4 },
  tcBullet:  { flexDirection: "row", marginBottom: 2 },
  tcDot:     { width: 8, textAlign: "center" },
  tcTxt:     { fontSize: 8, flex: 1 },
  qrImg:     { width: 90, height: 90, marginBottom: 4 },
  qrTxt:     { fontSize: 8, textAlign: "center" },

  // Signature row: fixed height, everything bottom-anchored so labels always align.
  sigRow: {
    flexDirection: "row",
    marginTop: 28,
    justifyContent: "space-between",
    height: 90,
  },
  sigCell: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",   // stack children toward the bottom
    paddingHorizontal: 6,
  },
  // Fixed slot above the line/label so images can't push the label around.
  sigImgSlot: {
    width: "100%",
    height: 55,
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  sigLine: { borderTopWidth: 1, borderTopColor: BLACK, width: "100%", marginBottom: 3 },
  sigTxt: { fontSize: 8, textAlign: "center" },
  sigImg: { maxWidth: 110, height: 50, objectFit: "contain" },

  // Photo-evidence page (page 2, only if before/after exist)
  evidencePageTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  evidenceSubtitle:  { fontSize: 9, color: GREY, marginBottom: 12 },
  evidenceRow:       { flexDirection: "row", gap: 14 },
  evidenceCol:       { flex: 1 },
  evidenceHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    padding: 6,
    marginBottom: 8,
    textAlign: "center",
  },
  evidenceBeforeHeader: { backgroundColor: "#94a3b8" },
  evidenceAfterHeader:  { backgroundColor: "#10b981" },
  evidencePhoto: {
    width: "100%",
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: GREY,
    objectFit: "cover",
  },
  evidenceEmpty: {
    borderWidth: 1,
    borderColor: GREY,
    borderStyle: "dashed",
    padding: 20,
    textAlign: "center",
    color: GREY,
    fontSize: 9,
  },

  ackTxt: { textAlign: "center", marginTop: 18, fontFamily: "Helvetica-Bold", fontSize: 9 },

  stampImg: {
    maxWidth: 65,
    height: 55,
    objectFit: "contain",
  },
});

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoicePDF({
  invoice, items, qrDataUrl, technicianSignatureUrl,
  beforePhotos = [], afterPhotos = [],
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  qrDataUrl: string;
  /** Public URL to the assigned technician's signature image. */
  technicianSignatureUrl?: string | null;
  /** Signed URLs for photos captured by the requester (before). */
  beforePhotos?: string[];
  /** Signed URLs for the technician's proof-of-fix photos (after). */
  afterPhotos?: string[];
}) {
  const hasEvidence = beforePhotos.length > 0 || afterPhotos.length > 0;
  return (
    <Document title={invoice.receipt_no}>
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ─────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.logoBox}>
            {/* Your logo — served from public/invoice-logo.png */}
            <Image src="/invoice-logo.png" style={styles.logoImg} />
          </View>

          <View style={styles.centerCol}>
            <Text style={styles.centerBold}>WHATSAPP US @ 8757 3360 / 9340 1360</Text>
            <Text style={styles.redText}>TAX INVOICE/RECEIPT</Text>
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
            <Text style={styles.contractLabel}>Contract / Invoice</Text>
            <View style={styles.receiptNoLine}>
              <Text style={styles.receiptNoLabel}>Receipt No.</Text>
              <Text style={styles.receiptNoVal}>{invoice.receipt_no}</Text>
            </View>
          </View>
        </View>

        <View style={styles.hr} />

        {/* ── CUSTOMER DETAILS ───────────────────────────────── */}
        <View style={styles.customerGrid}>
          <View style={styles.customerCol}>
            <View style={styles.cField}>
              <Text style={styles.cLabel}>Customer M/s:</Text>
              <Text style={styles.cValue}>{invoice.customer_name}</Text>
            </View>
            <View style={styles.cField}>
              <Text style={styles.cLabel}>Address:</Text>
              <Text style={styles.cValue}>{invoice.customer_address ?? ""}</Text>
            </View>
          </View>

          <View style={styles.customerCol}>
            <View style={styles.cField}>
              <Text style={styles.cLabel}>Date:</Text>
              <Text style={styles.cValue}>{invoice.invoice_date}</Text>
            </View>
            <View style={styles.cField}>
              <Text style={styles.cLabel}>Time In:</Text>
              <Text style={styles.cValue}>{invoice.time_in ?? ""}</Text>
              <Text style={styles.cLabel}>Time Out:</Text>
              <Text style={styles.cValue}>{invoice.time_out ?? ""}</Text>
            </View>
            <View style={styles.cField}>
              <Text style={styles.cLabel}>Contact No:</Text>
              <Text style={styles.cValue}>{invoice.contact_no ?? ""}</Text>
            </View>
          </View>
        </View>

        {/* ── ITEMS TABLE ────────────────────────────────────── */}
        <View style={styles.table}>
          <View style={[styles.tRow, styles.tHead]}>
            <Text style={[styles.tCell, styles.cCode]}>Code/No</Text>
            <Text style={[styles.tCell, styles.cDesc]}>Description</Text>
            <Text style={[styles.tCell, styles.cUnit]}>Unit $</Text>
            <Text style={[styles.tCellLast, styles.cTotal]}>Total $</Text>
          </View>

          {items.map((it, i) => (
            <View style={styles.tRow} key={it.id}>
              <Text style={[styles.tCell, styles.cCode]}>{String(i + 1).padStart(3, "0")}</Text>
              <Text style={[styles.tCell, styles.cDesc]}>{it.description}</Text>
              <Text style={[styles.tCell, styles.cUnit]}>{money(it.unit_price)}</Text>
              <Text style={[styles.tCellLast, styles.cTotal]}>{money(it.unit_price)}</Text>
            </View>
          ))}

          {/* pad blank rows so the table looks structured even when short */}
          {Array.from({ length: Math.max(0, 6 - items.length) }).map((_, i) => (
            <View style={styles.tRow} key={`pad-${i}`}>
              <Text style={[styles.tCell, styles.cCode]}> </Text>
              <Text style={[styles.tCell, styles.cDesc]}> </Text>
              <Text style={[styles.tCell, styles.cUnit]}> </Text>
              <Text style={[styles.tCellLast, styles.cTotal]}> </Text>
            </View>
          ))}
        </View>

        {/* ── SUMMARY ────────────────────────────────────────── */}
        <View style={styles.summary}>
          {invoice.discount > 0 && (
            <View style={styles.sRow}>
              <Text style={styles.sLabel}>Discount</Text>
              <Text>({money(invoice.discount)})</Text>
            </View>
          )}
          <View style={styles.sRow}>
            <Text style={styles.sLabel}>Sub-Total</Text>
            <Text>{money(invoice.subtotal)}</Text>
          </View>
          {invoice.gst_amount > 0 && (
            <View style={styles.sRow}>
              <Text style={styles.sLabel}>GST</Text>
              <Text>{money(invoice.gst_amount)}</Text>
            </View>
          )}
          {invoice.deposit_amount > 0 && (
            <View style={styles.sRow}>
              <Text style={styles.sLabel}>Deposit</Text>
              <Text>({money(invoice.deposit_amount)})</Text>
            </View>
          )}
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandVal}>S$ {money(invoice.grand_total)}</Text>
          </View>
        </View>

        {/* ── FOOTER: T&C + PAYMENT ──────────────────────────── */}
        <View style={styles.footerRow}>
          <View style={styles.tcCol}>
            <Text style={styles.tcTitle}>Terms &amp; Conditions</Text>
            {[
              "30% deposit payable upon confirmation of works order",
              "Balance amount payable upon completion of works order",
              "Deposit is non-refundable if works order cancelled after confirmation",
              "Goods delivered are not returnable & Goods sold are not exchangeable",
            ].map((b, i) => (
              <View style={styles.tcBullet} key={i}>
                <Text style={styles.tcDot}>•</Text>
                <Text style={styles.tcTxt}>{b}</Text>
              </View>
            ))}
          </View>

          <View style={styles.qrCol}>
            {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImg} /> : null}
            <Text style={styles.qrTxt}>
              We accept only Paynow to UEN 202212959Z or QR Code
            </Text>
            <Text style={[styles.qrTxt, { fontFamily: "Helvetica-Bold", marginTop: 2 }]}>
              Practice cashless transaction
            </Text>
          </View>
        </View>

        {/* ── SIGNATURES ─────────────────────────────────────── */}
        <Text style={styles.ackTxt}>
          I/We confirm the acceptance of the above service been completed satisfactory
        </Text>
        <View style={styles.sigRow}>
          {/* Customer — empty slot above line, then line, then label */}
          <View style={styles.sigCell}>
            <View style={styles.sigImgSlot} />
            <View style={styles.sigLine} />
            <Text style={styles.sigTxt}>Customer&apos;s Signature</Text>
          </View>

          {/* Company Stamp — stamp fills slot; line + label still align with other cells */}
          <View style={styles.sigCell}>
            <View style={styles.sigImgSlot}>
              <Image src="/invoice-stamp.png" style={styles.stampImg} />
            </View>
            <View style={styles.sigLine} />
            <Text style={styles.sigTxt}>Company Stamp</Text>
          </View>

          {/* Technician — signature (if any) fills slot */}
          <View style={styles.sigCell}>
            <View style={styles.sigImgSlot}>
              {technicianSignatureUrl ? (
                <Image src={technicianSignatureUrl} style={styles.sigImg} />
              ) : null}
            </View>
            <View style={styles.sigLine} />
            <Text style={styles.sigTxt}>Technical Team Leader</Text>
          </View>
        </View>
      </Page>

      {/* ── PAGE 2 — Photo evidence (only if any exist) ────────────────────── */}
      {hasEvidence && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.evidencePageTitle}>Photo evidence — {invoice.receipt_no}</Text>
          <Text style={styles.evidenceSubtitle}>
            Attached to this service. All photos captured on the day of work.
          </Text>

          <View style={styles.evidenceRow}>
            {/* Before column */}
            <View style={styles.evidenceCol}>
              <Text style={[styles.evidenceHeader, styles.evidenceBeforeHeader]}>
                BEFORE (from requester)
              </Text>
              {beforePhotos.length > 0 ? (
                beforePhotos.map((url, i) => (
                  <Image key={`b-${i}`} src={url} style={styles.evidencePhoto} />
                ))
              ) : (
                <Text style={styles.evidenceEmpty}>No before photos on record.</Text>
              )}
            </View>

            {/* After column */}
            <View style={styles.evidenceCol}>
              <Text style={[styles.evidenceHeader, styles.evidenceAfterHeader]}>
                AFTER (proof of fix)
              </Text>
              {afterPhotos.length > 0 ? (
                afterPhotos.map((url, i) => (
                  <Image key={`a-${i}`} src={url} style={styles.evidencePhoto} />
                ))
              ) : (
                <Text style={styles.evidenceEmpty}>No after photos on record.</Text>
              )}
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}
