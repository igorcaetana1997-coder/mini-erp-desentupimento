import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { COMPANY } from "@/lib/company";

const LOGO_RATIO = 1800 / 603;
const ICON_RATIO = 536 / 452;
const LOGO_WIDTH = 130;
const WATERMARK_WIDTH = 300;

export const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#4A4437",
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    paddingTop: 40,
    paddingBottom: 46,
    paddingHorizontal: 42,
  },
  watermark: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkImage: {
    width: WATERMARK_WIDTH,
    height: WATERMARK_WIDTH / ICON_RATIO,
    opacity: 0.04,
  },
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#142D65",
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH / LOGO_RATIO,
  },
  companyBlock: {
    alignItems: "flex-end",
  },
  razao: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#142D65",
    marginBottom: 2,
  },
  fantasia: {
    fontFamily: "Times-Italic",
    fontSize: 8.5,
    color: "#4A4437",
    marginBottom: 6,
  },
  fiscalRow: {
    flexDirection: "row",
    marginBottom: 1.5,
  },
  fiscalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#4A4437",
    width: 52,
    textAlign: "right",
    marginRight: 6,
  },
  fiscalValue: {
    fontSize: 8.5,
    color: "#4A4437",
    textAlign: "left",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  kicker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#142D65",
    marginBottom: 4,
  },
  numero: {
    fontSize: 8.5,
    color: "#4A4437",
    marginBottom: 4,
  },
  servico: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: "#221D14",
  },
  stamp: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#142D65",
  },
  footerText: {
    fontSize: 7,
    color: "#4A4437",
    lineHeight: 1.5,
  },
  footerHash: {
    fontSize: 6.5,
    color: "#8A8272",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    marginBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "#E3DFD3",
  },
  infoCol: { width: "48%" },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#4A4437",
    marginBottom: 3,
  },
  fieldValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#221D14",
    marginBottom: 2,
  },
  fieldSub: {
    fontSize: 9,
    color: "#635B4C",
    lineHeight: 1.4,
  },
  table: { marginBottom: 12 },
  theadRow: { flexDirection: "row", backgroundColor: "#142D65" },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#F2EFE9",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thDesc: { flex: 1 },
  thValor: { width: 90, textAlign: "right" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E3DFD3",
  },
  td: { fontSize: 9, color: "#221D14", paddingVertical: 8, paddingHorizontal: 8 },
  tdDesc: { flex: 1 },
  tdValor: { width: 90, textAlign: "right", fontFamily: "Helvetica-Bold" },
  subLine: { fontFamily: "Times-Italic", fontSize: 7.5, color: "#4A4437", marginTop: 3 },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 2,
    borderTopColor: "#142D65",
    paddingTop: 8,
  },
  totalLabel: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#142D65",
    paddingHorizontal: 8,
  },
  totalValue: {
    width: 90,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#142D65",
    paddingHorizontal: 8,
  },
  disclaimer: {
    fontFamily: "Times-Italic",
    fontSize: 8,
    color: "#4A4437",
    lineHeight: 1.5,
    marginTop: 4,
  },
  signatureBlock: {
    marginTop: 34,
  },
  signatureCaption: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#4A4437",
    marginBottom: 6,
  },
  signatureImage: {
    width: 130,
    height: 60,
    objectFit: "contain",
    marginBottom: 4,
  },
  signatureLine: {
    width: "60%",
    borderTopWidth: 1,
    borderTopColor: "#948C7D",
  },
});

function FiscalRow({ label, value }) {
  return (
    <View style={styles.fiscalRow}>
      <Text style={styles.fiscalLabel}>{label}</Text>
      <Text style={styles.fiscalValue}>{value}</Text>
    </View>
  );
}

export function DocumentoPdfShell({ kicker, numero, titulo, stampLabel, stampBg, stampText, hash, emitidoEm, children }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.watermark} fixed>
        <Image src="/logo-icon-outline.png" style={styles.watermarkImage} />
      </View>

      <View style={styles.letterhead}>
        <Image src="/logo-horizontal-outline.png" style={styles.logo} />
        <View style={styles.companyBlock}>
          <Text style={styles.razao}>{COMPANY.razaoSocial.toUpperCase()}</Text>
          <Text style={styles.fantasia}>{COMPANY.nomeFantasia}</Text>
          <FiscalRow label="CNPJ" value={COMPANY.cnpj} />
          <FiscalRow label="Endereço" value={COMPANY.endereco} />
          <FiscalRow label="Bairro" value={COMPANY.bairroCidade} />
          <FiscalRow label="CEP" value={COMPANY.cep} />
          <FiscalRow label="Telefone" value={COMPANY.telefone} />
          <FiscalRow label="E-mail" value={COMPANY.email} />
        </View>
      </View>

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.numero}>{numero}</Text>
          <Text style={styles.servico}>{titulo}</Text>
        </View>
        <Text style={[styles.stamp, { backgroundColor: stampBg, color: stampText }]}>{stampLabel}</Text>
      </View>

      {children}

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
          {COMPANY.razaoSocial} — CNPJ {COMPANY.cnpj}
          {"\n"}
          Documento emitido eletronicamente pelo sistema em {emitidoEm}.
        </Text>
        <Text style={styles.footerHash}>{hash}</Text>
      </View>
    </Page>
  );
}

export function ItemsTable({ descricao, subLinha, valorLabel, valor, totalLabel, totalValor }) {
  return (
    <View style={styles.table}>
      <View style={styles.theadRow}>
        <Text style={[styles.th, styles.thDesc]}>Descrição</Text>
        <Text style={[styles.th, styles.thValor]}>{valorLabel || "Valor"}</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.tdDesc}>
          <Text style={styles.td}>{descricao}</Text>
          {subLinha ? <Text style={[styles.subLine, { paddingHorizontal: 8 }]}>{subLinha}</Text> : null}
        </View>
        <Text style={[styles.td, styles.tdValor]}>{valor}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
        <Text style={styles.totalValue}>{totalValor}</Text>
      </View>
    </View>
  );
}
