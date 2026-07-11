// Status de pagamento é sempre derivado de valorPago vs value — nunca gravado direto.
// pago: recebeu tudo. parcial: recebeu uma parte. pendente: não recebeu nada.
// null: a OS não tem valor definido (nada a cobrar ainda).
export function getStatusPagamento(os) {
  const value = os.value;
  const valorPago = os.valorPago || 0;

  if (value === null || value === undefined) {
    return { status: null, faltante: 0 };
  }

  const faltante = Math.max(0, value - valorPago);
  let status;
  if (valorPago <= 0) status = "pendente";
  else if (valorPago >= value) status = "pago";
  else status = "parcial";

  return { status, faltante };
}
