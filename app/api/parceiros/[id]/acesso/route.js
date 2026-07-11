import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cria o login (User com role "parceiro") pra um parceiro já cadastrado.
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
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
  const password = body.password || "";

  if (!email || password.length < 6) {
    return NextResponse.json({ error: "E-mail e senha (mín. 6 caracteres) são obrigatórios" }, { status: 400 });
  }

  const emailEmUso = await prisma.user.findUnique({ where: { email } });
  if (emailEmUso) {
    return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const login = await prisma.user.create({
    data: {
      name: parceiro.name,
      email,
      password: hashed,
      role: "parceiro",
      parceiroId: parceiro.id,
    },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(login, { status: 201 });
}
