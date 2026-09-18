import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor, roleLabel } from "@/lib/permissions";
import { registrarAuditoria, descreverAlteracoes } from "@/lib/audit";
import { formatMoeda } from "@/lib/formatMoeda";
import { validarItens, calcularTotalItens, consolidarServiceType } from "@/lib/orcamentoItens";
import { validarDescontoAvistaPercentual } from "@/lib/orcamentoDesconto";

const include = {
  cliente: true,
  ordemServico: { select: { id: true } },
  itens: { orderBy: { ordem: "asc" } },
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
  let novosItens = null;
  if (body.itens !== undefined) {
    const { itens, error: erroItens } = validarItens(body.itens);
    if (erroItens) {
      return NextResponse.json({ error: erroItens }, { status: 400 });
    }
    novosItens = itens;
    data.serviceType = consolidarServiceType(itens);
    data.value = calcularTotalItens(itens);
  } else {
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
  }
  if (body.validoAte !== undefined) {
    data.validoAte = body.validoAte ? new Date(body.validoAte) : null;
  }
  if (typeof body.observacoes === "string") {
    data.observacoes = body.observacoes.trim() || null;
  }
  if (typeof body.mensagemCapa === "string" || body.mensagemCapa === null) {
    data.mensagemCapa = body.mensagemCapa?.trim() || null;
  }
  if (body.descontoAvistaPercentual !== undefined) {
    const { percentual, error: erroDesconto } = validarDescontoAvistaPercentual(body.descontoAvistaPercentual);
    if (erroDesconto) {
      return NextResponse.json({ error: erroDesconto }, { status: 400 });
    }
    data.descontoAvistaPercentual = percentual;
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    if (novosItens) {
      await tx.orcamentoItem.deleteMany({ where: { orcamentoId: params.id } });
      await tx.orcamentoItem.createMany({
        data: novosItens.map((it, idx) => ({ ...it, ordem: idx, orcamentoId: params.id })),
      });
    }
    return tx.orcamento.update({ where: { id: params.id }, data, include });
  });

  const mudancas = novosItens ? ["os itens do orçamento"] : [];
  mudancas.push(
    ...descreverAlteracoes(orcamento, data, {
      ...(novosItens
        ? {}
        : { value: { label: "o valor", format: (v) => `R$ ${formatMoeda(v)}` }, serviceType: { label: "o tipo de serviço" } }),
      validoAte: { label: "a validade", format: (v) => (v ? new Date(v).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "sem validade") },
      observacoes: { label: "as observações" },
      mensagemCapa: { label: "a mensagem de capa" },
      descontoAvistaPercentual: {
        label: "o desconto à vista",
        format: (v) => (v ? `${v}%` : "sem desconto"),
      },
    })
  );
  await registrarAuditoria({
    session,
    action: "update",
    entity: "Orcamento",
    entityId: atualizado.id,
    description:
      mudancas.length > 0
        ? `${session.user.name} (${roleLabel(session.user.role)}) alterou ${mudancas.join("; ")} do orçamento de ${atualizado.cliente?.name || "cliente"}`
        : `${session.user.name} (${roleLabel(session.user.role)}) editou o orçamento de ${atualizado.cliente?.name || "cliente"}`,
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
