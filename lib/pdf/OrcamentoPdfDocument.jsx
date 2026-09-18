import { Document, View, Text } from "@react-pdf/renderer";
import { DocumentoPdfShell, ItemsTable, styles } from "./DocumentoPdfShell";
import { formatEndereco } from "@/lib/formatEndereco";
import { formatMoeda } from "@/lib/formatMoeda";
import { montarMensagemDescontoAvista } from "@/lib/orcamentoDesconto";

export default function OrcamentoPdfDocument({ orcamento, stamp, emitidoEmLabel, numero, assets }) {
  const valorTotalTexto = `R$ ${formatMoeda(orcamento.value)}`;
  const mensagemDesconto = montarMensagemDescontoAvista(orcamento);
  const temItens = orcamento.itens?.length > 0;
  const linhasItens = temItens
    ? orcamento.itens.map((it) => ({
        id: it.id,
        descricao: it.quantidade > 1 ? `${it.descricao} (x${it.quantidade})` : it.descricao,
        valorFormatado: `R$ ${formatMoeda(it.quantidade * it.valorUnitario)}`,
      }))
    : null;
  const titulo = orcamento.itens?.length > 1 ? "Orçamento de serviços" : orcamento.serviceType;

  return (
    <Document>
      <DocumentoPdfShell
        kicker="Orçamento de serviço"
        numero={numero}
        titulo={titulo}
        stampLabel={stamp.label}
        stampBg={stamp.bg}
        stampText={stamp.text}
        hash={`ORC-${orcamento.id.slice(-6).toUpperCase()}`}
        emitidoEm={emitidoEmLabel}
        logoSrc={assets?.logoSrc}
        watermarkSrc={assets?.watermarkSrc}
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

        {orcamento.mensagemCapa ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.fieldLabel}>Mensagem</Text>
            <Text style={styles.fieldSub}>{orcamento.mensagemCapa}</Text>
          </View>
        ) : null}

        {mensagemDesconto ? (
          <View style={{ backgroundColor: "#C6FE1F", borderRadius: 4, paddingVertical: 7, paddingHorizontal: 10, marginBottom: 10 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, color: "#142D65" }}>{mensagemDesconto}</Text>
          </View>
        ) : null}

        <ItemsTable
          descricao={orcamento.serviceType}
          valor={valorTotalTexto}
          itens={linhasItens}
          totalLabel="Valor total do orçamento"
          totalValor={valorTotalTexto}
        />

        {orcamento.observacoes ? (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.fieldLabel}>Observações</Text>
            <Text style={styles.fieldSub}>{orcamento.observacoes}</Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          Este orçamento não substitui nota fiscal e não constitui cobrança — os valores podem ser
          ajustados após vistoria técnica no local.
        </Text>
      </DocumentoPdfShell>
    </Document>
  );
}
