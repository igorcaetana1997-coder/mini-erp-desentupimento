import { Document, View, Text, Image } from "@react-pdf/renderer";
import { DocumentoPdfShell, ItemsTable, styles } from "./DocumentoPdfShell";
import { formatEndereco } from "@/lib/formatEndereco";

export default function ReciboPdfDocument({
  osId,
  serviceType,
  cliente,
  dataVisitaLabel,
  tecnicoNome,
  value,
  materiais,
  avaliacaoNota,
  assinaturaCliente,
  totalLabel,
  osStamp,
  emitidoEmLabel,
}) {
  const valorTexto = value != null ? `R$ ${Number(value).toFixed(2)}` : "—";

  return (
    <Document>
      <DocumentoPdfShell
        kicker="Recibo de ordem de serviço"
        numero={`OS Nº ${osId.slice(-6).toUpperCase()} · Atendimento em ${dataVisitaLabel}`}
        titulo={serviceType}
        stampLabel={osStamp.label}
        stampBg={osStamp.bg}
        stampText={osStamp.text}
        hash={`REC-${osId.slice(-6).toUpperCase()}`}
        emitidoEm={emitidoEmLabel}
      >
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.fieldLabel}>Cliente</Text>
            <Text style={styles.fieldValue}>{cliente?.name}</Text>
            <Text style={styles.fieldSub}>{formatEndereco(cliente)}</Text>
            <Text style={styles.fieldSub}>{cliente?.phone}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.fieldLabel}>Atendimento</Text>
            <Text style={styles.fieldValue}>{dataVisitaLabel}</Text>
            <Text style={styles.fieldSub}>Técnico responsável: {tecnicoNome || "—"}</Text>
          </View>
        </View>

        <ItemsTable
          descricao={serviceType}
          subLinha={materiais ? `Materiais: ${materiais}` : null}
          valor={valorTexto}
          totalLabel={totalLabel}
          totalValor={valorTexto}
        />

        {avaliacaoNota ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.fieldLabel}>Avaliação do cliente</Text>
            <Text style={styles.fieldSub}>{avaliacaoNota} / 5</Text>
          </View>
        ) : null}

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureCaption}>Assinatura do cliente</Text>
          {assinaturaCliente ? <Image src={assinaturaCliente} style={styles.signatureImage} /> : null}
          <View style={styles.signatureLine} />
        </View>
      </DocumentoPdfShell>
    </Document>
  );
}
