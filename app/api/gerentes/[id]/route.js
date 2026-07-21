import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, roleLabel } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";

// Edição de gerente — só admin.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const gerente = await prisma.user.findUnique({ where: { id: params.id } });
  if (!gerente || gerente.role !== "gerente") {
    return NextResponse.json({ error: "Gerente não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const data = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.phone === "string") data.phone = body.phone.trim() || null;

  if (data.name === "") {
    return NextResponse.json({ error: "Nome não pode ficar em branco" }, { status: 400 });
  }

  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "E-mail não pode ficar em branco" }, { status: 400 });
    }
    const emailEmUso = await prisma.user.findFirst({ where: { email, id: { not: params.id } } });
    if (emailEmUso) {
      return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
    }
    data.email = email;
  }

  if (typeof body.username === "string") {
    const username = body.username.trim().toLowerCase();
    if (username && !/^[a-z0-9._-]+$/.test(username)) {
      return NextResponse.json(
        { error: "Usuário deve conter apenas letras, números, ponto, hífen ou underline" },
        { status: 400 }
      );
    }
    if (username) {
      const usernameEmUso = await prisma.user.findFirst({ where: { username, id: { not: params.id } } });
      if (usernameEmUso) {
        return NextResponse.json({ error: "Já existe um usuário com esse nome de usuário" }, { status: 409 });
      }
    }
    data.username = username || null;
  }

  const atualizado = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, username: true, phone: true },
  });

  await registrarAuditoria({
    session,
    action: "update",
    entity: "Gerente",
    entityId: atualizado.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) editou o gerente ${atualizado.name}`,
  });

  return NextResponse.json(atualizado);
}

// Exclusão de gerente — só admin.
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem excluir gerentes" }, { status: 403 });
  }

  const gerente = await prisma.user.findUnique({ where: { id: params.id } });
  if (!gerente || gerente.role !== "gerente") {
    return NextResponse.json({ error: "Gerente não encontrado" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.id } });

  await registrarAuditoria({
    session,
    action: "delete",
    entity: "Gerente",
    entityId: gerente.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) excluiu o gerente ${gerente.name}`,
  });

  return NextResponse.json({ ok: true });
}
