import { Document, View, Text } from "@react-pdf/renderer";
import { DocumentoPdfShell, ItemsTable, styles } from "./DocumentoPdfShell";
import { formatEndereco } from "@/lib/formatEndereco";
import { formatMoeda } from "@/lib/formatMoeda";

export default function OrcamentoPdfDocument({ orcamento, stamp, emitidoEmLabel, numero }) {
  const valorTexto = `R$ ${formatMoeda(orcamento.value)}`;

  return (
    <Document>
      <DocumentoPdfShell
        kicker="Orçamento de serviço"
        numero={numero}
        titulo={orcamento.serviceType}
        stampLabel={stamp.label}
        stampBg={stamp.bg}
        stampText={stamp.text}
        hash={`ORC-${orcamento.id.slice(-6).toUpperCase()}`}
        emitidoEm={emitidoEmLabel}
      >
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.fieldLabel}>Cliente</Text>
            <Text style={styles.fieldValue}>{orcamento.cliente?.name}</Text>
            <Text style={styles.fieldSub}>{formatEndereco(orcamento.cliente)}</Text>
            <Text style={styles.fieldSub}>{orcamento.cliente?.phone}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.fieldLabel}>Validade do orçamento</Text>
            <Text style={styles.fieldValue}>
              {orcamento.validoAte
                ? new Date(orcamento.validoAte).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                : "Não informada"}
            </Text>
            <Text style={styles.fieldSub}>Sujeito a confirmação após vistoria no local.</Text>
          </View>
        </View>

        <ItemsTable
          descricao={orcamento.serviceType}
          subLinha={orcamento.observacoes || null}
          valor={valorTexto}
          totalLabel="Valor total do orçamento"
          totalValor={valorTexto}
        />

        <Text style={styles.disclaimer}>
          Este orçamento não substitui nota fiscal e não constitui cobrança — os valores podem ser
          ajustados após vistoria técnica no local.
        </Text>
      </DocumentoPdfShell>
    </Document>
  );
}
