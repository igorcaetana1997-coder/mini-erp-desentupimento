import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";

// Cria o login (User com role "parceiro") pra um parceiro já cadastrado.
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem criar acesso para parceiros" }, { status: 403 });
  }

  const parceiro = await prisma.parceiro.findUnique({ where: { id: params.id } });
  if (!parceiro) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  const existente = await prisma.user.findFirst({ where: { parceiroId: params.id } });
  if (existente) {
    return NextResponse.json({ error: "Este parceiro já tem um acesso cadastrado" }, { status: 409 });
  }

  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();
  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || password.length < 6) {
    return NextResponse.json({ error: "E-mail e senha (mín. 6 caracteres) são obrigatórios" }, { status: 400 });
  }
  if (username && !/^[a-z0-9._-]+$/.test(username)) {
    return NextResponse.json(
      { error: "Usuário deve conter apenas letras, números, ponto, hífen ou underline" },
      { status: 400 }
    );
  }

  const emailEmUso = await prisma.user.findUnique({ where: { email } });
  if (emailEmUso) {
    return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
  }
  if (username) {
    const usernameEmUso = await prisma.user.findUnique({ where: { username } });
    if (usernameEmUso) {
      return NextResponse.json({ error: "Já existe um usuário com esse nome de usuário" }, { status: 409 });
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  const login = await prisma.user.create({
    data: {
      name: parceiro.name,
      email,
      username: username || null,
      password: hashed,
      role: "parceiro",
      parceiroId: parceiro.id,
    },
    select: { id: true, name: true, email: true, username: true },
  });

  await registrarAuditoria({
    session,
    action: "create",
    entity: "Parceiro",
    entityId: parceiro.id,
    description: `${session.user.name} criou acesso de login para o parceiro ${parceiro.name}`,
  });

  return NextResponse.json(login, { status: 201 });
}
