import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor, roleLabel } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";

const include = {
  cliente: true,
  ordemServico: { select: { id: true } },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const orcamentos = await prisma.orcamento.findMany({
    include,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orcamentos);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem criar orçamentos" }, { status: 403 });
  }

  const body = await req.json();
  const { clienteId, serviceType, value, validoAte, observacoes } = body;

  if (!clienteId || !serviceType) {
    return NextResponse.json({ error: "Cliente e tipo de serviço são obrigatórios" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const valorNumero = Number(value);
  if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
    return NextResponse.json({ error: "Valor deve ser um número maior que zero" }, { status: 400 });
  }

  const orcamento = await prisma.orcamento.create({
    data: {
      clienteId,
      serviceType,
      value: valorNumero,
      validoAte: validoAte ? new Date(validoAte) : null,
      observacoes: observacoes?.trim() || null,
    },
    include,
  });

  await registrarAuditoria({
    session,
    action: "create",
    entity: "Orcamento",
    entityId: orcamento.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) criou orçamento para ${orcamento.cliente?.name || "cliente"} (R$ ${orcamento.value})`,
  });

  return NextResponse.json(orcamento, { status: 201 });
}
