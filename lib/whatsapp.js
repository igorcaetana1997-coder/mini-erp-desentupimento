// Envio de mensagens de WhatsApp via Z-API (z-api.io).
//
// Fica dormente enquanto ZAPI_INSTANCE_ID / ZAPI_TOKEN / ZAPI_CLIENT_TOKEN não estiverem
// configuradas — isWhatsappConfigured() é a trava usada pela rota do cron
// (app/api/cron/notificacoes-diarias/route.js) pra não tocar no banco enquanto a automação
// não estiver realmente ligada.

export function isWhatsappConfigured() {
  return Boolean(
    process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN && process.env.ZAPI_CLIENT_TOKEN
  );
}

export async function sendWhatsappMessage(phone, message) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits || !isWhatsappConfigured()) return;

  const url = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": process.env.ZAPI_CLIENT_TOKEN,
    },
    body: JSON.stringify({ phone: `55${digits}`, message }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao enviar WhatsApp (${res.status}): ${await res.text()}`);
  }
}
