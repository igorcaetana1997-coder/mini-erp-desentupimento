import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor, roleLabel } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json();
  const data = {};
  if (body.minValor !== undefined) {
    const minValor = Number(body.minValor);
    if (!Number.isFinite(minValor) || minValor < 0) {
      return NextResponse.json({ error: "Valor mínimo deve ser um número maior ou igual a zero" }, { status: 400 });
    }
    data.minValor = minValor;
  }
  if (body.percentual !== undefined) {
    const percentual = Number(body.percentual);
    if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
      return NextResponse.json({ error: "Percentual deve ser um número entre 0 e 100" }, { status: 400 });
    }
    data.percentual = percentual;
  }

  const faixa = await prisma.faixaComissao.update({ where: { id: params.id }, data });

  await registrarAuditoria({
    session,
    action: "update",
    entity: "FaixaComissao",
    entityId: faixa.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) editou a faixa de comissão a partir de R$ ${faixa.minValor}`,
  });

  return NextResponse.json(faixa);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const faixa = await prisma.faixaComissao.findUnique({ where: { id: params.id } });
  await prisma.faixaComissao.delete({ where: { id: params.id } });

  await registrarAuditoria({
    session,
    action: "delete",
    entity: "FaixaComissao",
    entityId: params.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) excluiu a faixa de comissão a partir de R$ ${faixa?.minValor ?? "?"}`,
  });

  return NextResponse.json({ ok: true });
}
