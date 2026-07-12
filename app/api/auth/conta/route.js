import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Permite que qualquer usuário logado (admin, técnico ou parceiro) troque o
// próprio e-mail e/ou nome de usuário, confirmando a senha atual por segurança
// (mesmo padrão de /api/auth/senha).
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const senhaAtual = body.senhaAtual || "";
  const email = (body.email || "").trim().toLowerCase();
  const username = (body.username || "").trim().toLowerCase();

  if (!senhaAtual || !email) {
    return NextResponse.json({ error: "Senha atual e e-mail são obrigatórios" }, { status: 400 });
  }
  if (username && !/^[a-z0-9._-]+$/.test(username)) {
    return NextResponse.json(
      { error: "Usuário deve conter apenas letras, números, ponto, hífen ou underline" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const valid = await bcrypt.compare(senhaAtual, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
  }

  const emailEmUso = await prisma.user.findFirst({ where: { email, id: { not: user.id } } });
  if (emailEmUso) {
    return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
  }
  if (username) {
    const usernameEmUso = await prisma.user.findFirst({ where: { username, id: { not: user.id } } });
    if (usernameEmUso) {
      return NextResponse.json({ error: "Já existe um usuário com esse nome de usuário" }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { email, username: username || null },
    select: { id: true, name: true, email: true, username: true },
  });

  return NextResponse.json(updated);
}
