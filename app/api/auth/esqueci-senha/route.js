import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";

const MENSAGEM_GENERICA = {
  message: "Se esse e-mail estiver cadastrado, você vai receber um link de redefinição em instantes.",
};

export async function POST(req) {
  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Informe um e-mail" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const { token, tokenHash, expiresAt } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${token}`;
    sendPasswordResetEmail(user.email, resetUrl).catch((err) => {
      console.error("Falha ao enviar e-mail de redefinição de senha:", err);
    });
  }

  return NextResponse.json(MENSAGEM_GENERICA);
}
