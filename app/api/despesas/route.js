import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {};
  if (from || to) {
    where.data = {};
    if (from) where.data.gte = new Date(`${from}T00:00:00`);
    if (to) where.data.lte = new Date(`${to}T23:59:59`);
  }

  const despesas = await prisma.despesa.findMany({
    where,
    orderBy: { data: "desc" },
  });

  return NextResponse.json(despesas);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem lançar despesas" }, { status: 403 });
  }

  const body = await req.json();
  const descricao = (body.descricao || "").trim();
  const categoria = (body.categoria || "").trim();
  const valor = Number(body.valor);
  const data = body.data ? new Date(body.data) : new Date();

  if (!descricao) {
    return NextResponse.json({ error: "Descrição é obrigatória" }, { status: 400 });
  }
  if (!Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ error: "Valor deve ser um número maior que zero" }, { status: 400 });
  }

  const despesa = await prisma.despesa.create({
    data: { descricao, categoria: categoria || null, valor, data },
  });

  return NextResponse.json(despesa, { status: 201 });
}
