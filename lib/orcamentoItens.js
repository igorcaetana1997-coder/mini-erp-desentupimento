// Com totalFechado, os itens são só uma lista de serviços (descrição +
// quantidade) e o valor unitário fica 0 — o total é digitado à mão.
export function validarItens(itensBrutos, { totalFechado = false } = {}) {
  if (!Array.isArray(itensBrutos) || itensBrutos.length === 0) {
    return { error: "Inclua pelo menos um item no orçamento" };
  }
  const itens = [];
  for (const bruto of itensBrutos) {
    const descricao = typeof bruto?.descricao === "string" ? bruto.descricao.trim() : "";
    const quantidade = Number(bruto?.quantidade ?? 1);
    const valorUnitario = totalFechado ? 0 : Number(bruto?.valorUnitario);
    if (!descricao) return { error: "Todos os itens precisam de uma descrição" };
    if (!Number.isInteger(quantidade) || quantidade < 1) return { error: "Quantidade inválida em um dos itens" };
    if (!totalFechado && (!Number.isFinite(valorUnitario) || valorUnitario <= 0)) {
      return { error: "Valor unitário inválido em um dos itens" };
    }
    itens.push({ descricao, quantidade, valorUnitario });
  }
  return { itens };
}

export function validarValorFechado(valorBruto) {
  const valor = Number(valorBruto);
  if (!Number.isFinite(valor) || valor <= 0) {
    return { error: "Informe o valor total do orçamento (maior que zero)" };
  }
  return { valor: Math.round(valor * 100) / 100 };
}

export function calcularTotalItens(itens) {
  const total = itens.reduce((acc, it) => acc + it.quantidade * it.valorUnitario, 0);
  return Math.round(total * 100) / 100;
}

export function consolidarServiceType(itens) {
  return itens.map((it) => `${it.descricao} (x${it.quantidade})`).join("; ");
}
