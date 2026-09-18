import nodemailer from "nodemailer";

// E-mail de orçamento sai da caixa comercial de verdade da empresa (Titan
// Email / HostGator), via SMTP direto — não pelo Resend usado no resto do
// sistema (esqueci senha, backup de clientes), porque isso exigiria
// verificar o domínio raiz no Resend mexendo em DNS. Fica dormente
// (erro claro ao chamar) enquanto SMTP_* não estiverem preenchidas.
const FROM_NAME = "Real Leader Desentupidora";

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let cachedTransporter = null;
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const port = Number(process.env.SMTP_PORT || 465);
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = TLS implícito; 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransporter;
}

export async function sendOrcamentoEmail(destinatario, { pdfBuffer, nomeArquivo, mensagem, numero, clienteNome }) {
  if (!isSmtpConfigured()) {
    throw new Error("Envio de e-mail não configurado (variáveis SMTP_* ausentes)");
  }

  const transporter = getTransporter();
  const mensagemHtml = (mensagem || "")
    .split("\n")
    .filter(Boolean)
    .map((linha) => `<p style="margin:0 0 10px;">${linha}</p>`)
    .join("");

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: destinatario,
    subject: `Orçamento ${numero} — Real Leader Desentupidora`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #A02018;">Real Leader Desentupidora</h2>
        <p>Olá, ${clienteNome || ""}!</p>
        ${mensagemHtml}
        <p>Segue em anexo o orçamento em PDF.</p>
        <p style="color: #888; font-size: 13px;">Este e-mail foi enviado pelo sistema da Real Leader Desentupidora.</p>
      </div>
    `,
    attachments: [{ filename: nomeArquivo, content: pdfBuffer }],
  });
}
