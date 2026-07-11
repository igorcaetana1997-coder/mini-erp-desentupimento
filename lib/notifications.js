// Ponto de extensão para notificações automáticas ao cliente (WhatsApp/SMS).
//
// Hoje isso é um no-op: só loga no console do servidor. Quando a empresa
// contratar um provedor pago (Twilio, Z-API, etc.), a integração real entra
// aqui — o resto do app já chama esta função nos momentos certos
// (recusa, avanço de status, conclusão), então não precisa mexer em mais nada.
//
// Exemplo de implementação futura:
//   const res = await fetch("https://api.z-api.io/.../send-text", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ phone: cliente.phone, message }),
//   });

export async function notifyClienteStatusChange(evento, { cliente, os }) {
  try {
    console.log(
      `[notifications] (stub, não enviado) evento="${evento}" cliente="${cliente?.name}" telefone="${cliente?.phone}" osId="${os?.id}"`
    );
  } catch {
    // nunca deixar uma falha de notificação quebrar o fluxo principal
  }
}
