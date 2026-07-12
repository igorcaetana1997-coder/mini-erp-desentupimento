import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Edição de técnico — só admin.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const tecnico = await prisma.user.findUnique({ where: { id: params.id } });
  if (!tecnico || tecnico.role !== "tecnico") {
    return NextResponse.json({ error: "Técnico não encontrado" }, { status: 404 });
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
  return NextResponse.json(atualizado);
}

// Exclusão de técnico — só admin. As OS já atribuídas a ele ficam sem
// técnico designado (FK technicianId é ON DELETE SET NULL), não são apagadas.
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem excluir técnicos" }, { status: 403 });
  }

  const tecnico = await prisma.user.findUnique({ where: { id: params.id } });
  if (!tecnico || tecnico.role !== "tecnico") {
    return NextResponse.json({ error: "Técnico não encontrado" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
