import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor, roleLabel } from "@/lib/permissions";
import { registrarAuditoria, descreverAlteracoes } from "@/lib/audit";
import { formatMoeda } from "@/lib/formatMoeda";

// Edição da despesa/conta a pagar, incluindo marcar/desmarcar como paga.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const despesa = await prisma.despesa.findUnique({ where: { id: params.id } });
  if (!despesa) {
    return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
  }

  const body = await req.json();
  const data = {};

  if (typeof body.descricao === "string") data.descricao = body.descricao.trim();
  if (typeof body.categoria === "string") data.categoria = body.categoria.trim() || null;
  if (body.valor !== undefined) {
    const valor = Number(body.valor);
    if (!Number.isFinite(valor) || valor <= 0) {
      return NextResponse.json({ error: "Valor deve ser um número maior que zero" }, { status: 400 });
    }
    data.valor = valor;
  }
  if (body.data !== undefined) data.data = new Date(body.data);
  if (body.vencimento !== undefined) data.vencimento = body.vencimento ? new Date(body.vencimento) : null;

  if (data.descricao === "") {
    return NextResponse.json({ error: "Descrição não pode ficar em branco" }, { status: 400 });
  }

  if (body.status !== undefined) {
    if (body.status === "pago") {
      data.status = "pago";
      data.pagoEm = new Date();
    } else if (body.status === "pendente") {
      data.status = "pendente";
      data.pagoEm = null;
    } else {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
  }

  const atualizada = await prisma.despesa.update({ where: { id: params.id }, data });
  const quem = `${session.user.name} (${roleLabel(session.user.role)})`;

  if (body.status !== undefined && Object.keys(data).length === 2) {
    // Só mudou status/pagoEm — mensagem dedicada de pago/pendente.
    await registrarAuditoria({
      session,
      action: "status",
      entity: "Despesa",
      entityId: atualizada.id,
      description:
        body.status === "pago"
          ? `${quem} marcou a despesa "${atualizada.descricao}" como paga`
          : `${quem} marcou a despesa "${atualizada.descricao}" como pendente`,
    });
  } else {
    const mudancas = descreverAlteracoes(despesa, data, {
      valor: { label: "o valor", format: (v) => `R$ ${formatMoeda(v)}` },
      descricao: { label: "a descrição" },
      categoria: { label: "a categoria" },
      vencimento: { label: "o vencimento", format: (v) => (v ? new Date(v).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "sem vencimento") },
    });
    await registrarAuditoria({
      session,
      action: "update",
      entity: "Despesa",
      entityId: atualizada.id,
      description:
        mudancas.length > 0
          ? `${quem} alterou ${mudancas.join("; ")} da despesa "${atualizada.descricao}"`
          : `${quem} editou a despesa "${atualizada.descricao}"`,
    });
  }

  return NextResponse.json(atualizada);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const despesa = await prisma.despesa.findUnique({ where: { id: params.id } });
  if (!despesa) {
    return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
  }

  await prisma.despesa.delete({ where: { id: params.id } });

  await registrarAuditoria({
    session,
    action: "delete",
    entity: "Despesa",
    entityId: despesa.id,
    description: `${session.user.name} (${roleLabel(session.user.role)}) excluiu a despesa "${despesa.descricao}"`,
  });

  return NextResponse.json({ ok: true });
}
