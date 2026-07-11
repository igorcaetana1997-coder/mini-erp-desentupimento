import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const senhaAtual = body.senhaAtual || "";
  const novaSenha = body.novaSenha || "";

  if (!senhaAtual || novaSenha.length < 6) {
    return NextResponse.json({ error: "Senha atual e nova senha (mín. 6 caracteres) são obrigatórias" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const valid = await bcrypt.compare(senhaAtual, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(novaSenha, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ message: "Senha alterada com sucesso" });
}
