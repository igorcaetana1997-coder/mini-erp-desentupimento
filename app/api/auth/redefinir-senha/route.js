import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/passwordReset";

export async function POST(req) {
  const body = await req.json();
  const token = body.token || "";
  const password = body.password || "";

  if (!token || password.length < 6) {
    return NextResponse.json({ error: "Token e senha (mín. 6 caracteres) são obrigatórios" }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Este link de redefinição é inválido ou expirou. Solicite um novo." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ message: "Senha redefinida com sucesso" });
}
