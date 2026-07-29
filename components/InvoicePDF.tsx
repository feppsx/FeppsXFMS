// Invoice PDF — new palette (red header, blue accents, light-blue info block).
import {
  Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";
import type { Invoice, InvoiceItem } from "@/lib/db-types";
import type { CompanyBranding } from "@/lib/company-settings-data";

const RED   = "#9A121A";
const BLUE  = "#003882";
const INFO  = "#E3ECF6";
const BLACK = "#000";
const GREY  = "#666";
const LIGHT = "#f5f5f5";

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", fontSize: 9, color: BLACK },

  // Red header band
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

  // Number pill overlapping header bottom
  numberPill: {
    marginHorizontal: 24, marginTop: -14, backgroundColor: "white",
    borderRadius: 8, padding: 8, paddingHorizontal: 14,
    flexDirection: "row", justifyContent: "space-between",
    borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  numberLabel: { fontFamily: "Helvetica-Bold", fontSize: 10, color: BLUE },
  numberVal:   { fontFamily: "Helvetica-Bold", fontSize: 10, color: RED },

  body: { padding: 24, paddingTop: 18 },

  // Customer info card (light blue)
  infoCard: { backgroundColor: INFO, borderRadius: 10, padding: 10 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoCell: { width: "50%", flexDirection: "row", marginBottom: 4, paddingRight: 8 },
  infoLabel: { color: "#64748b", fontSize: 9 },
  infoVal:   { color: BLACK, fontSize: 9, marginLeft: 4, flex: 1 },

  // Items table
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

  // Summary block
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

  // Footer (T&C + QR)
  footerRow: { flexDirection: "row", marginTop: 18, gap: 12 },
  tcCol: { flex: 1 },
  qrCol: { width: 150, backgroundColor: INFO, borderRadius: 8, padding: 10, alignItems: "center" },
  tcTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: BLUE, marginBottom: 3 },
  tcBullet: { flexDirection: "row", marginBottom: 1 },
  tcDot: { width: 8, textAlign: "center", fontSize: 8 },
  tcTxt: { fontSize: 8, flex: 1 },
  qrImg: { width: 80, height: 80, marginBottom: 4, backgroundColor: "white" },
  qrTxt: { fontSize: 7, textAlign: "center", color: BLUE, fontFamily: "Helvetica-Bold" },

  ackTxt: {
    textAlign: "center", marginTop: 20, paddingTop: 8,
    borderTopWidth: 1.5, borderTopColor: RED,
    color: BLUE, fontFamily: "Helvetica-Bold", fontSize: 9,
  },

  sigRow: { flexDirection: "row", marginTop: 14, gap: 10 },
  sigCell: { flex: 1, alignItems: "center" },
  sigSlot: { width: "100%", height: 45, alignItems: "center", justifyContent: "flex-end" },
  sigLine: { borderTopWidth: 1, borderTopColor: BLACK, width: "100%", marginTop: 2 },
  sigTxt: { fontSize: 8, textAlign: "center", marginTop: 3 },
  sigImg: { maxWidth: 100, height: 40, objectFit: "contain" },
  stampImg: { maxWidth: 60, height: 45, objectFit: "contain" },

  // Photo evidence page 2
  evidenceTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: RED, marginBottom: 4 },
  evidenceSub:   { fontSize: 9, color: GREY, marginBottom: 12 },
  evidenceRow:   { flexDirection: "row", gap: 12 },
  evidenceCol:   { flex: 1 },
  evidenceHead:  { color: "white", padding: 6, fontFamily: "Helvetica-Bold", fontSize: 11, textAlign: "center", marginBottom: 8, borderRadius: 4 },
  evBefore: { backgroundColor: "#94a3b8" },
  evAfter:  { backgroundColor: "#10b981" },
  evPhoto:  { width: "100%", marginBottom: 8, borderRadius: 4, objectFit: "cover" },
  evEmpty:  { borderWidth: 1, borderColor: GREY, borderStyle: "dashed", padding: 20, textAlign: "center", color: GREY, fontSize: 9, borderRadius: 4 },
});

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoicePDF({
  invoice, items, qrDataUrl, technicianSignatureUrl,
  beforePhotos = [], afterPhotos = [],
  branding,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  qrDataUrl: string;
  technicianSignatureUrl?: string | null;
  beforePhotos?: string[];
  afterPhotos?: string[];
  branding?: CompanyBranding | null;
}) {
  const hasEvidence = beforePhotos.length > 0 || afterPhotos.length > 0;
  const b = branding ?? null;
  const logoSrc = b?.logo_url || "/invoice-logo.png";
  const stampSrc = b?.stamp_url || "/invoice-stamp.png";
  const companyName = b?.company_name || "360 INTEGRATED FM & SM PTE. LTD.";
  const addressLine = b?.address_line || "71 Bukit Batok Cres #06-11 Prestige Centre, Singapore";
  const gstReg = b?.gst_reg || "202212959Z";
  const waLine = b?.phone_whatsapp ? `WHATSAPP US @ ${b.phone_whatsapp}` : "WHATSAPP US @ 8757 3360 / 9340 1360";
  const tcLines = (b?.invoice_terms || "30% deposit payable upon confirmation of works order\nBalance amount payable upon completion of works order\nDeposit non-refundable if order cancelled after confirmation\nGoods delivered are not returnable & sold are not exchangeable").split(/\n+/).filter(Boolean);
  const paynowFooter = b?.paynow_text || "Paynow UEN 202212959Z";

  return (
    <Document title={invoice.receipt_no}>
      <Page size="A4" style={styles.page}>
        {/* Red header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoBox}>
              <Image src={logoSrc} style={styles.logoImg} />
            </View>
            <View style={styles.centerCol}>
              <Text style={styles.whatsapp}>{waLine}</Text>
              <Text style={styles.titleTxt}>TAX INVOICE / RECEIPT</Text>
              <Text style={styles.gstTxt}>GST Registration No. {gstReg}</Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.address}>{addressLine}</Text>
            </View>
          </View>
        </View>

        {/* Number pill */}
        <View style={styles.numberPill}>
          <Text style={styles.numberLabel}>Receipt No.</Text>
          <Text style={styles.numberVal}>{invoice.receipt_no}</Text>
        </View>

        <View style={styles.body}>
          {/* Customer info */}
          <View style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Customer:</Text>
                <Text style={styles.infoVal}>{invoice.customer_name}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoVal}>{invoice.invoice_date}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoVal}>{invoice.customer_address ?? ""}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Contact:</Text>
                <Text style={styles.infoVal}>{invoice.contact_no ?? ""}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Time In / Out:</Text>
                <Text style={styles.infoVal}>{invoice.time_in ?? ""} / {invoice.time_out ?? ""}</Text>
              </View>
            </View>
          </View>

          {/* Items table */}
          <View style={styles.table}>
            <View style={styles.tHead}>
              <Text style={[styles.th, styles.cCode]}>Code</Text>
              <Text style={[styles.th, styles.cDesc]}>Description</Text>
              <Text style={[styles.th, styles.cUnit]}>Unit $</Text>
              <Text style={[styles.th, styles.cTotal]}>Total $</Text>
            </View>
            {items.map((it, i) => (
              <View style={[styles.tRow, i % 2 === 1 ? styles.tRowAlt : {}]} key={it.id}>
                <Text style={[styles.td, styles.cCode]}>{String(i + 1).padStart(3, "0")}</Text>
                <Text style={[styles.td, styles.cDesc]}>{it.description}</Text>
                <Text style={[styles.td, styles.cUnit]}>{money(it.unit_price)}</Text>
                <Text style={[styles.td, styles.cTotal]}>{money(it.unit_price)}</Text>
              </View>
            ))}
            {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
              <View style={[styles.tRow, (items.length + i) % 2 === 1 ? styles.tRowAlt : {}]} key={`pad-${i}`}>
                <Text style={[styles.td, styles.cCode]}> </Text>
                <Text style={[styles.td, styles.cDesc]}> </Text>
                <Text style={[styles.td, styles.cUnit]}> </Text>
                <Text style={[styles.td, styles.cTotal]}> </Text>
              </View>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.summaryWrap}>
            <View style={styles.summary}>
              <View style={styles.sRow}>
                <Text style={styles.sLabel}>Sub-Total</Text>
                <Text style={styles.monoR}>{money(invoice.subtotal)}</Text>
              </View>
              {invoice.discount > 0 && (
                <View style={styles.sRow}>
                  <Text style={styles.sLabel}>Discount</Text>
                  <Text style={styles.monoR}>({money(invoice.discount)})</Text>
                </View>
              )}
              {invoice.gst_amount > 0 && (
                <View style={styles.sRow}>
                  <Text style={styles.sLabel}>GST</Text>
                  <Text style={styles.monoR}>{money(invoice.gst_amount)}</Text>
                </View>
              )}
              {invoice.deposit_amount > 0 && (
                <View style={styles.sRow}>
                  <Text style={styles.sLabel}>Deposit</Text>
                  <Text style={styles.monoR}>({money(invoice.deposit_amount)})</Text>
                </View>
              )}
              <View style={styles.grandRow}>
                <Text style={styles.grandLbl}>Grand Total</Text>
                <Text style={styles.grandVal}>S$ {money(invoice.grand_total)}</Text>
              </View>
            </View>
          </View>

          {/* T&C + QR */}
          <View style={styles.footerRow}>
            <View style={styles.tcCol}>
              <Text style={styles.tcTitle}>Terms &amp; Conditions</Text>
              {tcLines.map((b, i) => (
                <View style={styles.tcBullet} key={i}>
                  <Text style={styles.tcDot}>•</Text>
                  <Text style={styles.tcTxt}>{b}</Text>
                </View>
              ))}
            </View>
            <View style={styles.qrCol}>
              {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImg} /> : null}
              <Text style={styles.qrTxt}>{paynowFooter}</Text>
            </View>
          </View>

          {/* Signature strip */}
          <Text style={styles.ackTxt}>
            I / We confirm the acceptance of the above service been completed satisfactorily
          </Text>
          <View style={styles.sigRow}>
            <View style={styles.sigCell}>
              <View style={styles.sigSlot} />
              <View style={styles.sigLine} />
              <Text style={styles.sigTxt}>Customer&apos;s Signature</Text>
            </View>
            <View style={styles.sigCell}>
              <View style={styles.sigSlot}>
                <Image src={stampSrc} style={styles.stampImg} />
              </View>
              <View style={styles.sigLine} />
              <Text style={styles.sigTxt}>Company Stamp</Text>
            </View>
            <View style={styles.sigCell}>
              <View style={styles.sigSlot}>
                {technicianSignatureUrl ? (
                  <Image src={technicianSignatureUrl} style={styles.sigImg} />
                ) : null}
              </View>
              <View style={styles.sigLine} />
              <Text style={styles.sigTxt}>Technical Team Leader</Text>
            </View>
          </View>
        </View>
      </Page>

      {hasEvidence && (
        <Page size="A4" style={[styles.page, { padding: 24 }]}>
          <Text style={styles.evidenceTitle}>Photo evidence — {invoice.receipt_no}</Text>
          <Text style={styles.evidenceSub}>Attached to this service. All photos captured on the day of work.</Text>
          <View style={styles.evidenceRow}>
            <View style={styles.evidenceCol}>
              <Text style={[styles.evidenceHead, styles.evBefore]}>BEFORE (from requester)</Text>
              {beforePhotos.length > 0
                ? beforePhotos.map((url, i) => <Image key={`b-${i}`} src={url} style={styles.evPhoto} />)
                : <Text style={styles.evEmpty}>No before photos on record.</Text>}
            </View>
            <View style={styles.evidenceCol}>
              <Text style={[styles.evidenceHead, styles.evAfter]}>AFTER (proof of fix)</Text>
              {afterPhotos.length > 0
                ? afterPhotos.map((url, i) => <Image key={`a-${i}`} src={url} style={styles.evPhoto} />)
                : <Text style={styles.evEmpty}>No after photos on record.</Text>}
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}
