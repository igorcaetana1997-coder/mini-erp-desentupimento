import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const include = {
  cliente: true,
  technician: { select: { id: true, name: true } },
  parceiro: { select: { id: true, name: true } },
  fotos: true,
};

const VALID_PAYMENT_METHODS = ["dinheiro", "pix", "cartao", "boleto"];
const VALID_PARCERIA_TIPOS = ["repassado", "recebido"];

// Edição geral da OS (não mexe no fluxo aberta/andamento/concluida, que vive
// em /avancar e /concluir). Admin pode editar praticamente tudo, incluindo
// reatribuir técnico e reabrir uma OS recusada. Técnico só edita materiais e
// a própria avaliação, e só na sua OS.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const os = await prisma.ordemServico.findUnique({ where: { id: params.id } });
  if (!os) {
    return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  const isOwner = os.technicianId === session.user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Você não tem acesso a esta ordem de serviço" }, { status: 403 });
  }

  const body = await req.json();
  const data = {};

  // Campos que técnico dono e admin podem editar
  if (typeof body.materiais === "string") data.materiais = body.materiais.trim() || null;
  if (body.avaliacaoNota !== undefined) {
    if (body.avaliacaoNota === null || body.avaliacaoNota === "") {
      data.avaliacaoNota = null;
    } else {
      const nota = Number(body.avaliacaoNota);
      if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        return NextResponse.json({ error: "Nota de avaliação deve ser um número inteiro de 1 a 5" }, { status: 400 });
      }
      data.avaliacaoNota = nota;
    }
  }

  if (!isAdmin) {
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualizar" }, { status: 400 });
    }
    const updated = await prisma.ordemServico.update({ where: { id: params.id }, data, include });
    return NextResponse.json(updated);
  }

  // Campos exclusivos do admin
  if (body.technicianId !== undefined) {
    if (body.technicianId) {
      const tecnico = await prisma.user.findUnique({ where: { id: body.technicianId } });
      if (!tecnico || tecnico.role !== "tecnico") {
        return NextResponse.json({ error: "Técnico inválido" }, { status: 400 });
      }
    }
    data.technicianId = body.technicianId || null;
  }
  if (body.scheduledAt) data.scheduledAt = new Date(body.scheduledAt);
  if (body.value !== undefined) data.value = body.value === "" || body.value === null ? null : Number(body.value);
  if (typeof body.urgent === "boolean") data.urgent = body.urgent;
  if (body.paymentMethod !== undefined) {
    if (body.paymentMethod && !VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json({ error: "Forma de pagamento inválida" }, { status: 400 });
    }
    data.paymentMethod = body.paymentMethod || null;
  }
  if (body.paymentStatus !== undefined) {
    if (!["pago", "pendente"].includes(body.paymentStatus)) {
      return NextResponse.json({ error: "Status de pagamento inválido" }, { status: 400 });
    }
    data.paymentStatus = body.paymentStatus;
  }
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  // Terceirização: reatribuir/remover parceiro e comissão
  if (body.parceiroId !== undefined) {
    if (body.parceiroId) {
      const parceiro = await prisma.parceiro.findUnique({ where: { id: body.parceiroId } });
      if (!parceiro) {
        return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
      }
      const tipo = body.parceriaTipo !== undefined ? body.parceriaTipo : os.parceriaTipo;
      if (!VALID_PARCERIA_TIPOS.includes(tipo)) {
        return NextResponse.json({ error: "Tipo de parceria inválido" }, { status: 400 });
      }
      const percentualBruto = body.parceriaPercentual !== undefined ? body.parceriaPercentual : os.parceriaPercentual;
      const percentual = Number(percentualBruto);
      if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
        return NextResponse.json({ error: "Percentual da comissão deve ser um número entre 0 e 100" }, { status: 400 });
      }
      data.parceiroId = body.parceiroId;
      data.parceriaTipo = tipo;
      data.parceriaPercentual = percentual;
    } else {
      data.parceiroId = null;
      data.parceriaTipo = null;
      data.parceriaPercentual = null;
    }
  }

  // Reabrir uma OS recusada (única transição de status permitida por aqui)
  if (body.status !== undefined) {
    if (os.status === "recusada" && body.status === "aberta") {
      data.status = "aberta";
      data.motivoRecusa = null;
      data.recusadaEm = null;
    } else {
      return NextResponse.json(
        { error: "Só é possível reabrir (recusada -> aberta) por aqui. Use /avancar ou /concluir para o restante do fluxo." },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.ordemServico.update({ where: { id: params.id }, data, include });
  return NextResponse.json(updated);
}

// Exclusão definitiva da OS — só admin. Remove as fotos anexadas antes,
// já que o registro é apagado de vez (não é um "cancelar"/"recusar").
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem excluir ordens de serviço" }, { status: 403 });
  }

  const os = await prisma.ordemServico.findUnique({ where: { id: params.id } });
  if (!os) {
    return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
  }

  await prisma.fotoServico.deleteMany({ where: { ordemServicoId: params.id } });
  await prisma.ordemServico.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
