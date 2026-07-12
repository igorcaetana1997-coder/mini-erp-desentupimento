import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const tecnicos = await prisma.user.findMany({
    where: { role: "tecnico" },
    select: { id: true, name: true, email: true, username: true, phone: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tecnicos);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem cadastrar técnicos" }, { status: 403 });
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
  const tecnico = await prisma.user.create({
    data: { name, email, username: username || null, password: hashed, phone: phone || null, role: "tecnico" },
    select: { id: true, name: true, email: true, username: true, phone: true },
  });

  return NextResponse.json(tecnico, { status: 201 });
}
