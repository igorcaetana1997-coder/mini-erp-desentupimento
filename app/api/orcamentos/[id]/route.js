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

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const orcamento = await prisma.orcamento.findUnique({ where: { id: params.id }, include });
  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json(orcamento);
}

// Edição dos campos (só enquanto pendente) e transições de status. Quando o
// status vira "aprovado", cria a OS a partir do orçamento na mesma transação.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const orcamento = await prisma.orcamento.findUnique({ where: { id: params.id } });
  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  const body = await req.json();

  if (body.status !== undefined) {
    if (orcamento.status !== "pendente") {
      return NextResponse.json({ error: "Este orçamento já foi respondido" }, { status: 400 });
    }
    if (body.status === "aprovado") {
      const [ordemServico, atualizado] = await prisma.$transaction(async (tx) => {
        const os = await tx.ordemServico.create({
          data: {
            clienteId: orcamento.clienteId,
            serviceType: orcamento.serviceType,
            value: orcamento.value,
            scheduledAt: new Date(),
            status: "aberta",
          },
        });
        const orc = await tx.orcamento.update({
          where: { id: params.id },
          data: { status: "aprovado", ordemServicoId: os.id },
          include,
        });
        return [os, orc];
      });
      await registrarAuditoria({
        session,
        action: "status",
        entity: "Orcamento",
        entityId: orcamento.id,
        description: `${session.user.name} (${roleLabel(session.user.role)}) aprovou o orçamento de ${atualizado.cliente?.name || "cliente"} e gerou a OS`,
      });
      return NextResponse.json({ ...atualizado, ordemServicoId: ordemServico.id });
    }
    if (body.status === "recusado") {
      const atualizado = await prisma.orcamento.update({
        where: { id: params.id },
        data: { status: "recusado" },
        include,
      });
      await registrarAuditoria({
        session,
        action: "status",
        entity: "Orcamento",
        entityId: orcamento.id,
        description: `${session.user.name} (${roleLabel(session.user.role)}) recusou o orçamento de ${atualizado.cliente?.name || "cliente"}`,
      });
      return NextResponse.json(atualizado);
    }
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const data = {};
  if (typeof body.serviceType === "string" && body.serviceType.trim()) {
    data.serviceType = body.serviceType.trim();
  }
  if (body.value !== undefined) {
    const valorNumero = Number(body.value);
    if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
      return NextResponse.json({ error: "Valor deve ser um número maior que zero" }, { status: 400 });
    }
    data.value = valorNumero;
  }
  if (body.validoAte !== undefined) {
    data.validoAte = body.validoAte ? new Date(body.validoAte) : null;
  }
  if (typeof body.observacoes === "string") {
    data.observacoes = body.observacoes.trim() || null;
  }

  const atualizado = await prisma.orcamento.update({ where: { id: params.id }, data, include });

  await registrarAuditoria({
    session,
    action: "update",
    entity: "Orcamento",
    entityId: atualizado.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) editou o orçamento de ${atualizado.cliente?.name || "cliente"}`,
  });

  return NextResponse.json(atualizado);
}

// Exclusão direta — orçamento é um artefato leve pré-OS, sem lixeira/soft-delete.
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem excluir orçamentos" }, { status: 403 });
  }

  const orcamento = await prisma.orcamento.findUnique({ where: { id: params.id } });
  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  await prisma.orcamento.delete({ where: { id: params.id } });

  await registrarAuditoria({
    session,
    action: "delete",
    entity: "Orcamento",
    entityId: orcamento.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) excluiu um orçamento`,
  });

  return NextResponse.json({ ok: true });
}
