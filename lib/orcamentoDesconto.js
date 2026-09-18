// null/"" desativa o desconto; qualquer outro valor precisa ser um número
// entre 0 (exclusive) e 100.
export function validarDescontoAvistaPercentual(valorBruto) {
  if (valorBruto === undefined || valorBruto === null || valorBruto === "") {
    return { percentual: null };
  }
  const percentual = Number(valorBruto);
  if (!Number.isFinite(percentual) || percentual <= 0 || percentual > 100) {
    return { error: "Percentual de desconto à vista inválido (use um número entre 1 e 100)" };
  }
  return { percentual };
}

// Frase de oferta de desconto à vista, montada na hora a partir de
// descontoAvistaPercentual + validoAte — nunca guardada como texto fixo, pra
// não desatualizar se a validade mudar depois. Usada no PDF, no e-mail e no
// texto do WhatsApp, sempre igual.
export function montarMensagemDescontoAvista({ descontoAvistaPercentual, validoAte }) {
  if (!descontoAvistaPercentual) return null;
  const percentualLabel = String(descontoAvistaPercentual).replace(".", ",");
  const dataLabel = validoAte
    ? ` até ${new Date(validoAte).toLocaleDateString("pt-BR", { timeZone: "UTC" })}`
    : "";
  return `Fechando${dataLabel} conseguimos dar um desconto de ${percentualLabel}% no pagamento à vista!`;
}
