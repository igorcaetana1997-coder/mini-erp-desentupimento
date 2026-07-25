import { Resend } from "resend";

const ADMIN_EMAIL = "realleaderdesentupidora@gmail.com";

export async function sendClientesBackupEmail(csvContent, quantidade) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  await resend.emails.send({
    from: "Real Leader Desentupidora <naoresponda@mail.realleaderdesentupidora.com.br>",
    to: ADMIN_EMAIL,
    subject: `Backup semanal de clientes — ${hoje}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #A02018;">Real Leader Desentupidora</h2>
        <p>Segue em anexo o backup semanal com os ${quantidade} clientes cadastrados no sistema.</p>
        <p style="color: #888; font-size: 13px;">Enviado automaticamente toda sexta-feira.</p>
      </div>
    `,
    attachments: [
      {
        filename: `clientes-${hoje.replace(/\//g, "-")}.csv`,
        content: Buffer.from(csvContent, "utf-8"),
      },
    ],
  });
}

export async function sendPasswordResetEmail(to, resetUrl) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Real Leader Desentupidora <naoresponda@mail.realleaderdesentupidora.com.br>",
    to,
    subject: "Redefinir sua senha",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #A02018;">Real Leader Desentupidora</h2>
        <p>Você solicitou a redefinição da sua senha.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background: #C6FE1F; color: #A02018; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Redefinir senha
          </a>
        </p>
        <p>Ou copie e cole este link no navegador:</p>
        <p style="word-break: break-all; color: #555;">${resetUrl}</p>
        <p style="color: #888; font-size: 13px;">Este link expira em 1 hora. Se você não solicitou isso, pode ignorar este e-mail.</p>
      </div>
    `,
  });
}
