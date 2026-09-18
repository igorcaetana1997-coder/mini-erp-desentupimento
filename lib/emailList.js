const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Aceita uma string com vários e-mails separados por vírgula ou ponto e
// vírgula (como as pessoas costumam colar de um campo CC de outro e-mail) e
// normaliza pro formato que o Orcamento.emailsCopia guarda.
export function validarEmailsCopia(valorBruto) {
  if (valorBruto === undefined || valorBruto === null || !String(valorBruto).trim()) {
    return { emails: null };
  }
  const emails = String(valorBruto)
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean);
  if (emails.some((e) => !EMAIL_REGEX.test(e))) {
    return { error: "Um dos e-mails em cópia é inválido" };
  }
  return { emails: emails.join(", ") };
}
