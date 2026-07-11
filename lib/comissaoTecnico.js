// Acha a faixa de comissão atingida por um total faturado no período.
// A faixa escolhida é a de maior "minValor" que ainda seja <= totalFaturado
// (não é progressivo: a taxa dessa única faixa vale sobre o total inteiro).
export function calcularFaixa(faixas, totalFaturado) {
  if (!Array.isArray(faixas) || faixas.length === 0) return null;

  let escolhida = null;
  for (const faixa of faixas) {
    if (faixa.minValor <= totalFaturado) {
      if (!escolhida || faixa.minValor > escolhida.minValor) {
        escolhida = faixa;
      }
    }
  }
  return escolhida;
}
