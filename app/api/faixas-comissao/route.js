import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor, roleLabel } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const faixas = await prisma.faixaComissao.findMany({ orderBy: { minValor: "asc" } });
  return NextResponse.json(faixas);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem configurar faixas de comissão" }, { status: 403 });
  }

  const body = await req.json();
  const minValor = Number(body.minValor);
  const percentual = Number(body.percentual);

  if (!Number.isFinite(minValor) || minValor < 0) {
    return NextResponse.json({ error: "Valor mínimo deve ser um número maior ou igual a zero" }, { status: 400 });
  }
  if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
    return NextResponse.json({ error: "Percentual deve ser um número entre 0 e 100" }, { status: 400 });
  }

  const faixa = await prisma.faixaComissao.create({ data: { minValor, percentual } });

  await registrarAuditoria({
    session,
    action: "create",
    entity: "FaixaComissao",
    entityId: faixa.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) criou faixa de comissão a partir de R$ ${minValor} (${percentual}%)`,
  });

  return NextResponse.json(faixa, { status: 201 });
}
