import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";

// Gestão de gerentes é exclusiva do admin real — gerente não pode criar
// nem ver outros gerentes (evita autopromoção/escalada de privilégio).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const gerentes = await prisma.user.findMany({
    where: { role: "gerente" },
    select: { id: true, name: true, email: true, username: true, phone: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(gerentes);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem cadastrar gerentes" }, { status: 403 });
  }

  const body = await req.json();
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";
  const phone = (body.phone || "").trim();

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Nome, e-mail e senha (mín. 6 caracteres) são obrigatórios" },
      { status: 400 }
    );
  }
  if (username && !/^[a-z0-9._-]+$/.test(username)) {
    return NextResponse.json(
      { error: "Usuário deve conter apenas letras, números, ponto, hífen ou underline" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
  }
  if (username) {
    const usernameEmUso = await prisma.user.findUnique({ where: { username } });
    if (usernameEmUso) {
      return NextResponse.json({ error: "Já existe um usuário com esse nome de usuário" }, { status: 409 });
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  const gerente = await prisma.user.create({
    data: { name, email, username: username || null, password: hashed, phone: phone || null, role: "gerente" },
    select: { id: true, name: true, email: true, username: true, phone: true },
  });

  await registrarAuditoria({
    session,
    action: "create",
    entity: "Gerente",
    entityId: gerente.id,
    description: `${session.user.name} cadastrou o gerente ${gerente.name}`,
  });

  return NextResponse.json(gerente, { status: 201 });
}
