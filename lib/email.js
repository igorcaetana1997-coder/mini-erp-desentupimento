import { Resend } from "resend";

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
