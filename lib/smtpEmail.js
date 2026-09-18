import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { COMPANY } from "@/lib/company";
import { formatMoeda } from "@/lib/formatMoeda";

// E-mail de orçamento sai da caixa comercial de verdade da empresa (Titan
// Email / HostGator), via SMTP direto — não pelo Resend usado no resto do
// sistema (esqueci senha, backup de clientes), porque isso exigiria
// verificar o domínio raiz no Resend mexendo em DNS. Fica dormente
// (erro claro ao chamar) enquanto SMTP_* não estiverem preenchidas.
const FROM_NAME = "Real Leader Desentupidora";

const whatsappNumero = `55${COMPANY.telefone.replace(/\D/g, "")}`;
const logoPath = path.join(process.cwd(), "public", "logo-horizontal.png");

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

function primeiroNome(nomeCompleto) {
  return (nomeCompleto || "").trim().split(/\s+/)[0] || "";
}

function montarLinkWhatsapp(numero) {
  const texto = `Olá! Recebi o orçamento ${numero} da Real Leader Desentupidora e gostaria de saber mais.`;
  return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(texto)}`;
}

function montarHtml({ clienteNome, mensagem, numero, valorTotal, validoAteLabel }) {
  const mensagemBloco = (mensagem || "").trim()
    ? `
      <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 22px;">
        <tr>
          <td style="background:#F8F6EF;border-left:4px solid #A02018;border-radius:6px;padding:16px 20px;font-size:14.5px;line-height:1.6;color:#3a362d;">
            ${mensagem
              .trim()
              .split("\n")
              .filter(Boolean)
              .map((linha) => `<p style="margin:0 0 8px;">${linha}</p>`)
              .join("")}
          </td>
        </tr>
      </table>
    `
    : "";

  const statsBloco =
    valorTotal || validoAteLabel
      ? `
      <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 24px;background:#F2EFE9;border-radius:10px;">
        <tr>
          ${
            valorTotal
              ? `<td style="padding:16px 20px;">
                  <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#8B8478;">Valor total</p>
                  <p style="margin:3px 0 0;font-size:20px;font-weight:700;color:#142D65;">R$ ${valorTotal}</p>
                </td>`
              : ""
          }
          ${
            validoAteLabel
              ? `<td style="padding:16px 20px;text-align:right;">
                  <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#8B8478;">Válido até</p>
                  <p style="margin:3px 0 0;font-size:20px;font-weight:700;color:#142D65;">${validoAteLabel}</p>
                </td>`
              : ""
          }
        </tr>
      </table>
    `
      : "";

  return `
  <div style="background:#F2EFE9;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DAD4C6;">
      <div style="background:#FFFFFF;padding:28px 32px 20px;text-align:center;border-bottom:3px solid #A02018;">
        <img src="cid:rl-logo" alt="Real Leader Desentupidora" width="180" style="display:block;margin:0 auto;max-width:100%;height:auto;" />
      </div>

      <div style="padding:32px;">
        <p style="margin:0 0 6px;font-size:12.5px;letter-spacing:0.5px;text-transform:uppercase;color:#A02018;font-weight:700;">Orçamento ${numero}</p>
        <h1 style="margin:0 0 18px;font-size:22px;color:#142D65;">Olá, ${primeiroNome(clienteNome)}! 👋</h1>

        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3a362d;">
          Preparamos com carinho o orçamento com os serviços que você solicitou. Segue em anexo, em PDF, com todos os detalhes.
        </p>

        ${mensagemBloco}
        ${statsBloco}

        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a362d;">
          Qualquer dúvida ou se quiser agendar o serviço, é só responder este e-mail ou chamar a gente no WhatsApp — o atendimento é rápido!
        </p>

        <table role="presentation" style="margin:0 auto;">
          <tr>
            <td style="border-radius:10px;background:#C6FE1F;">
              <a href="${montarLinkWhatsapp(numero)}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#A02018;text-decoration:none;">
                Falar no WhatsApp
              </a>
            </td>
          </tr>
        </table>
      </div>

      <div style="background:#F2EFE9;padding:24px 32px;border-top:1px solid #DAD4C6;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#142D65;">Real Leader Desentupidora</p>
        <p style="margin:0 0 12px;font-size:12.5px;font-style:italic;color:#8B8478;">Atendimento rápido e de confiança em desentupimentos</p>
        <p style="margin:0;font-size:12.5px;color:#5c584f;line-height:1.8;">
          📞 ${COMPANY.telefone} &nbsp;·&nbsp; ✉️ ${process.env.SMTP_USER}<br />
          📍 ${COMPANY.endereco} — ${COMPANY.bairroCidade}
        </p>
      </div>
    </div>

    <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:11.5px;color:#8B8478;">
      Você está recebendo este e-mail porque solicitou um orçamento com a Real Leader Desentupidora.
    </p>
  </div>
  `;
}

export async function sendOrcamentoEmail(
  destinatario,
  { pdfBuffer, nomeArquivo, mensagem, numero, clienteNome, valorTotal, validoAte }
) {
  if (!isSmtpConfigured()) {
    throw new Error("Envio de e-mail não configurado (variáveis SMTP_* ausentes)");
  }

  const transporter = getTransporter();
  const validoAteLabel = validoAte
    ? new Date(validoAte).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    : null;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: destinatario,
    subject: `Orçamento ${numero} — Real Leader Desentupidora`,
    html: montarHtml({
      clienteNome,
      mensagem,
      numero,
      valorTotal: valorTotal != null ? formatMoeda(valorTotal) : null,
      validoAteLabel,
    }),
    attachments: [
      { filename: nomeArquivo, content: pdfBuffer },
      { filename: "logo.png", path: logoPath, cid: "rl-logo" },
    ],
  });
}
