import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor, roleLabel } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";
import { validarItens, validarValorFechado, calcularTotalItens, consolidarServiceType } from "@/lib/orcamentoItens";
import { validarDescontoAvistaPercentual } from "@/lib/orcamentoDesconto";
import { validarEmailsCopia } from "@/lib/emailList";

const include = {
  cliente: true,
  ordemServico: { select: { id: true } },
  itens: { orderBy: { ordem: "asc" } },
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
  const { clienteId, validoAte, observacoes, mensagemCapa } = body;

  if (!clienteId) {
    return NextResponse.json({ error: "Cliente é obrigatório" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const totalFechado = body.totalFechado === true;
  const { itens, error: erroItens } = validarItens(body.itens, { totalFechado });
  if (erroItens) {
    return NextResponse.json({ error: erroItens }, { status: 400 });
  }
  let valorTotal = calcularTotalItens(itens);
  if (totalFechado) {
    const { valor, error: erroValor } = validarValorFechado(body.valorTotal);
    if (erroValor) {
      return NextResponse.json({ error: erroValor }, { status: 400 });
    }
    valorTotal = valor;
  }

  const { percentual: descontoAvistaPercentual, error: erroDesconto } = validarDescontoAvistaPercentual(
    body.descontoAvistaPercentual
  );
  if (erroDesconto) {
    return NextResponse.json({ error: erroDesconto }, { status: 400 });
  }

  const { emails: emailsCopia, error: erroEmailsCopia } = validarEmailsCopia(body.emailsCopia);
  if (erroEmailsCopia) {
    return NextResponse.json({ error: erroEmailsCopia }, { status: 400 });
  }

  const orcamento = await prisma.orcamento.create({
    data: {
      clienteId,
      serviceType: consolidarServiceType(itens),
      value: valorTotal,
      totalFechado,
      mensagemCapa: mensagemCapa?.trim() || null,
      descontoAvistaPercentual,
      emailsCopia,
      validoAte: validoAte ? new Date(validoAte) : null,
      observacoes: observacoes?.trim() || null,
      itens: { create: itens.map((it, idx) => ({ ...it, ordem: idx })) },
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
