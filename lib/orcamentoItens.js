// Mantém Orcamento.serviceType/.value sempre sincronizados a partir dos
// itens — são "campos resumo", nunca aceitos crus do client quando há itens.
// Orçamentos legados (criados antes desta feature) não têm itens e continuam
// usando serviceType/value como texto livre, sem sincronização nenhuma.

export function validarItens(itensBrutos) {
  if (!Array.isArray(itensBrutos) || itensBrutos.length === 0) {
    return { error: "Inclua pelo menos um item no orçamento" };
  }

  const itens = [];
  for (const bruto of itensBrutos) {
    const descricao = typeof bruto?.descricao === "string" ? bruto.descricao.trim() : "";
    const quantidade = Number(bruto?.quantidade ?? 1);
    const valorUnitario = Number(bruto?.valorUnitario);

    if (!descricao) {
      return { error: "Todos os itens precisam de uma descrição" };
    }
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      return { error: "Quantidade inválida em um dos itens" };
    }
    if (!Number.isFinite(valorUnitario) || valorUnitario <= 0) {
      return { error: "Valor unitário inválido em um dos itens" };
    }
    itens.push({ descricao, quantidade, valorUnitario });
  }
  return { itens };
}

export function calcularTotalItens(itens) {
  const total = itens.reduce((acc, it) => acc + it.quantidade * it.valorUnitario, 0);
  return Math.round(total * 100) / 100;
}

export function consolidarServiceType(itens) {
  return itens.map((it) => `${it.descricao} (x${it.quantidade})`).join("; ");
}
