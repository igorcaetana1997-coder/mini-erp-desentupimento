import path from "node:path";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { ImapFlow } from "imapflow";
import { COMPANY } from "@/lib/company";
import { formatMoeda } from "@/lib/formatMoeda";
import { montarMensagemDescontoAvista } from "@/lib/orcamentoDesconto";

// E-mails transacionais saem das caixas de verdade da empresa (Titan Email /
// HostGator), via SMTP direto — não pelo Resend usado no resto do sistema
// (esqueci senha, backup de clientes), porque isso exigiria verificar o
// domínio raiz no Resend mexendo em DNS. Duas caixas, mesmo host/porta:
//   comercial@  → orçamentos e NF-e + boleto (SMTP_USER / SMTP_PASS)
//   financeiro@ → reservada (SMTP_FIN_USER / SMTP_FIN_PASS); a cobrança usa a
//                 comercial por decisão do Igor (11/10) — trocar é só o `conta`
//                 na rota /api/ordens/[id]/cobranca.
// Cada uma fica dormente (erro claro ao chamar) enquanto não estiver preenchida.
const FROM_NAME = "Real Leader Desentupidora";

const CONTAS = {
  comercial: { user: "SMTP_USER", pass: "SMTP_PASS" },
  financeiro: { user: "SMTP_FIN_USER", pass: "SMTP_FIN_PASS" },
};

const whatsappNumero = `55${COMPANY.telefone.replace(/\D/g, "")}`;
const logoPath = path.join(process.cwd(), "public", "logo-horizontal.png");

function credenciais(conta) {
  const chaves = CONTAS[conta];
  if (!chaves) throw new Error(`Conta SMTP desconhecida: ${conta}`);
  return { user: process.env[chaves.user], pass: process.env[chaves.pass] };
}

export function isSmtpConfigured(conta = "comercial") {
  const { user, pass } = credenciais(conta);
  return Boolean(process.env.SMTP_HOST && user && pass);
}

const transporters = {};
function getTransporter(conta) {
  if (transporters[conta]) return transporters[conta];
  const port = Number(process.env.SMTP_PORT || 465);
  const { user, pass } = credenciais(conta);
  transporters[conta] = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = TLS implícito; 587 = STARTTLS
    auth: { user, pass },
  });
  return transporters[conta];
}

// SMTP só entrega; quem grava a cópia em "Enviados" é o cliente de e-mail, via
// IMAP. Como aqui não tem cliente, a gente compõe a mensagem UMA vez, manda o
// MIME cru pelo SMTP e anexa o mesmo MIME na pasta de enviados da caixa —
// assim o webmail do Titan mostra o e-mail igual a um enviado à mão. Falha no
// IMAP não derruba o envio (o e-mail já saiu); só fica no log.
async function guardarEmEnviados(conta, raw) {
  const { user, pass } = credenciais(conta);
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || "imap.titan.email",
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: { user, pass },
    logger: false,
  });
  await client.connect();
  try {
    const pastas = await client.list();
    const enviados = pastas.find((p) => p.specialUse === "\\Sent")?.path || "Sent";
    await client.append(enviados, raw, ["\\Seen"]);
  } finally {
    await client.logout();
  }
}

async function enviarComCopia(conta, mail) {
  const transporter = getTransporter(conta);
  const compilado = new MailComposer(mail).compile();
  const envelope = compilado.getEnvelope();
  const raw = await compilado.build();
  await transporter.sendMail({ envelope, raw });
  try {
    await guardarEmEnviados(conta, raw);
  } catch (err) {
    console.error(`E-mail enviado, mas não foi possível gravar a cópia em Enviados (${conta}):`, err?.message || err);
  }
}

function primeiroNome(nomeCompleto) {
  return (nomeCompleto || "").trim().split(/\s+/)[0] || "";
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragrafos(texto) {
  return (texto || "")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((linha) => `<p style="margin:0 0 8px;">${escaparHtml(linha)}</p>`)
    .join("");
}

function linkWhatsapp(texto) {
  return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(texto)}`;
}

// Casca comum dos e-mails: logo no topo, corpo, botão de WhatsApp, assinatura.
function envolverLayout({ corpoHtml, botaoTexto, botaoHref, emailAssinatura, rodape }) {
  return `
  <div style="background:#F2EFE9;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DAD4C6;">
      <div style="background:#FFFFFF;padding:28px 32px 20px;text-align:center;border-bottom:3px solid #A02018;">
        <img src="cid:rl-logo" alt="Real Leader Desentupidora" width="180" style="display:block;margin:0 auto;max-width:100%;height:auto;" />
      </div>

      <div style="padding:32px;">
        ${corpoHtml}

        <table role="presentation" style="margin:0 auto;">
          <tr>
            <td style="border-radius:10px;background:#C6FE1F;">
              <a href="${botaoHref}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#A02018;text-decoration:none;">
                ${botaoTexto}
              </a>
            </td>
          </tr>
        </table>
      </div>

      <div style="background:#F2EFE9;padding:24px 32px;border-top:1px solid #DAD4C6;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#142D65;">Real Leader Desentupidora</p>
        <p style="margin:0 0 12px;font-size:12.5px;font-style:italic;color:#8B8478;">Atendimento rápido e de confiança em desentupimentos</p>
        <p style="margin:0;font-size:12.5px;color:#5c584f;line-height:1.8;">
          📞 ${COMPANY.telefone} &nbsp;·&nbsp; ✉️ ${emailAssinatura}<br />
          📍 ${COMPANY.endereco} — ${COMPANY.bairroCidade}
        </p>
      </div>
    </div>

    <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:11.5px;color:#8B8478;">
      ${rodape}
    </p>
  </div>
  `;
}

function montarHtmlOrcamento({ clienteNome, mensagem, numero, valorTotal, validoAteLabel, mensagemDesconto }) {
  const descontoBloco = mensagemDesconto
    ? `
      <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 22px;">
        <tr>
          <td style="background:#C6FE1F;border-radius:6px;padding:14px 20px;font-size:14.5px;font-weight:700;line-height:1.5;color:#142D65;">
            ${escaparHtml(mensagemDesconto)}
          </td>
        </tr>
      </table>
    `
    : "";

  const mensagemBloco = (mensagem || "").trim()
    ? `
      <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 22px;">
        <tr>
          <td style="background:#F8F6EF;border-left:4px solid #A02018;border-radius:6px;padding:16px 20px;font-size:14.5px;line-height:1.6;color:#3a362d;">
            ${paragrafos(mensagem)}
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

  const corpoHtml = `
        <p style="margin:0 0 6px;font-size:12.5px;letter-spacing:0.5px;text-transform:uppercase;color:#A02018;font-weight:700;">Orçamento ${escaparHtml(numero)}</p>
        <h1 style="margin:0 0 18px;font-size:22px;color:#142D65;">Olá, ${escaparHtml(primeiroNome(clienteNome))}! 👋</h1>

        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3a362d;">
          Preparamos com carinho o orçamento com os serviços que você solicitou. Segue em anexo, em PDF, com todos os detalhes.
        </p>

        ${mensagemBloco}
        ${descontoBloco}
        ${statsBloco}

        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a362d;">
          Qualquer dúvida ou se quiser agendar o serviço, é só responder este e-mail ou chamar a gente no WhatsApp — o atendimento é rápido!
        </p>
  `;

  return envolverLayout({
    corpoHtml,
    botaoTexto: "Falar no WhatsApp",
    botaoHref: linkWhatsapp(`Olá! Recebi o orçamento ${numero} da Real Leader Desentupidora e gostaria de saber mais.`),
    emailAssinatura: process.env.SMTP_USER,
    rodape: "Você está recebendo este e-mail porque solicitou um orçamento com a Real Leader Desentupidora.",
  });
}

export async function sendOrcamentoEmail(
  destinatario,
  { pdfBuffer, nomeArquivo, mensagem, numero, clienteNome, valorTotal, validoAte, descontoAvistaPercentual, cc }
) {
  if (!isSmtpConfigured("comercial")) {
    throw new Error("Envio de e-mail não configurado (variáveis SMTP_* ausentes)");
  }

  const validoAteLabel = validoAte
    ? new Date(validoAte).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    : null;

  await enviarComCopia("comercial", {
    from: `"${FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: destinatario,
    cc: cc || undefined,
    subject: `Orçamento ${numero} — Real Leader Desentupidora`,
    html: montarHtmlOrcamento({
      clienteNome,
      mensagem,
      numero,
      valorTotal: valorTotal != null ? formatMoeda(valorTotal) : null,
      validoAteLabel,
      mensagemDesconto: montarMensagemDescontoAvista({ descontoAvistaPercentual, validoAte }),
    }),
    attachments: [
      { filename: nomeArquivo, content: pdfBuffer },
      { filename: "logo.png", path: logoPath, cid: "rl-logo" },
    ],
  });
}

function montarHtmlCobranca({ clienteNome, numeroOs, servico, concluidaEmLabel, valor, vencimentoLabel, mensagem, anexos, emailFinanceiro }) {
  const mensagemBloco = (mensagem || "").trim()
    ? `
      <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 22px;">
        <tr>
          <td style="background:#F8F6EF;border-left:4px solid #A02018;border-radius:6px;padding:16px 20px;font-size:14.5px;line-height:1.6;color:#3a362d;">
            ${paragrafos(mensagem)}
          </td>
        </tr>
      </table>
    `
    : "";

  const linhasResumo = [
    ["Serviço", servico],
    concluidaEmLabel ? ["Concluído em", concluidaEmLabel] : null,
    valor ? ["Valor", `R$ ${valor}`] : null,
    vencimentoLabel ? ["Vencimento do boleto", vencimentoLabel] : null,
  ]
    .filter(Boolean)
    .map(
      ([rotulo, texto]) => `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid #E3DFD3;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#8B8478;width:45%;">${rotulo}</td>
          <td style="padding:9px 0;border-bottom:1px solid #E3DFD3;font-size:14px;font-weight:700;color:#142D65;text-align:right;">${escaparHtml(texto)}</td>
        </tr>`
    )
    .join("");

  const anexosLista = anexos
    .map((a) => `<li style="margin:0 0 6px;">📎 ${escaparHtml(a)}</li>`)
    .join("");

  const corpoHtml = `
        <p style="margin:0 0 6px;font-size:12.5px;letter-spacing:0.5px;text-transform:uppercase;color:#A02018;font-weight:700;">Serviço concluído · OS ${escaparHtml(numeroOs)}</p>
        <h1 style="margin:0 0 18px;font-size:22px;color:#142D65;">Olá, ${escaparHtml(primeiroNome(clienteNome))}! 👋</h1>

        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3a362d;">
          Foi um prazer atender você! O serviço foi concluído e, para fechar tudo certinho, seguem em anexo a nota fiscal e o boleto para pagamento.
        </p>

        ${mensagemBloco}

        <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 20px;">
          ${linhasResumo}
        </table>

        <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#8B8478;font-weight:700;">Anexos</p>
        <ul style="margin:0 0 22px;padding:0 0 0 4px;list-style:none;font-size:14px;color:#3a362d;">
          ${anexosLista}
        </ul>

        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a362d;">
          Se precisar da segunda via, de outra forma de pagamento ou tiver qualquer dúvida sobre a nota, é só responder este e-mail ou chamar a gente no WhatsApp. Obrigado pela confiança!
        </p>
  `;

  return envolverLayout({
    corpoHtml,
    botaoTexto: "Falar com o financeiro",
    botaoHref: linkWhatsapp(`Olá! Recebi a nota fiscal e o boleto da OS ${numeroOs} da Real Leader Desentupidora e gostaria de falar com o financeiro.`),
    emailAssinatura: emailFinanceiro,
    rodape: "Você está recebendo este e-mail porque contratou um serviço da Real Leader Desentupidora.",
  });
}

export async function sendCobrancaEmail(
  destinatario,
  { clienteNome, numeroOs, servico, concluidaEm, valor, vencimento, mensagem, anexos, cc, conta = "financeiro" }
) {
  if (!isSmtpConfigured(conta)) {
    throw new Error(`Envio de e-mail não configurado (variáveis SMTP da caixa ${conta} ausentes)`);
  }

  const { user: remetente } = credenciais(conta);
  const fmtData = (d) => (d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : null);

  await enviarComCopia(conta, {
    from: `"${FROM_NAME}" <${remetente}>`,
    to: destinatario,
    cc: cc || undefined,
    subject: `Nota fiscal e boleto — OS ${numeroOs} · Real Leader Desentupidora`,
    html: montarHtmlCobranca({
      clienteNome,
      numeroOs,
      servico,
      concluidaEmLabel: fmtData(concluidaEm),
      valor: valor != null ? formatMoeda(valor) : null,
      vencimentoLabel: fmtData(vencimento),
      mensagem,
      anexos: anexos.map((a) => a.filename),
      emailFinanceiro: remetente,
    }),
    attachments: [
      ...anexos.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
      { filename: "logo.png", path: logoPath, cid: "rl-logo" },
    ],
  });
}
