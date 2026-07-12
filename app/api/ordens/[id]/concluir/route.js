import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyClienteStatusChange } from "@/lib/notifications";

const include = {
  cliente: true,
  technician: { select: { id: true, name: true } },
  parceiro: { select: { id: true, name: true } },
  fotos: true,
};

const VALID_PAYMENT_METHODS = ["dinheiro", "pix", "cartao", "boleto"];

// Conclui a OS (andamento -> concluida). Exige assinatura do cliente;
// materiais, forma de pagamento e nota de avaliação são opcionais.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const os = await prisma.ordemServico.findUnique({ where: { id: params.id }, include: { cliente: true } });
  if (!os) {
    return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  const isOwner = os.technicianId === session.user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Você não tem acesso a esta ordem de serviço" }, { status: 403 });
  }

  if (os.status !== "andamento") {
    return NextResponse.json(
      { error: "Só é possível concluir uma OS que está em andamento" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const assinaturaCliente = body.assinaturaCliente;
  if (!assinaturaCliente || typeof assinaturaCliente !== "string" || !assinaturaCliente.startsWith("data:image/")) {
    return NextResponse.json({ error: "Assinatura do cliente é obrigatória para concluir" }, { status: 400 });
  }

  const data = { status: "concluida", assinaturaCliente, concluidaEm: new Date() };

  if (typeof body.materiais === "string") data.materiais = body.materiais.trim() || null;

  if (body.paymentMethod) {
    if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json({ error: "Forma de pagamento inválida" }, { status: 400 });
    }
    data.paymentMethod = body.paymentMethod;
  }

  if (body.avaliacaoNota !== undefined && body.avaliacaoNota !== null && body.avaliacaoNota !== "") {
    const nota = Number(body.avaliacaoNota);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return NextResponse.json({ error: "Nota de avaliação deve ser um número inteiro de 1 a 5" }, { status: 400 });
    }
    data.avaliacaoNota = nota;
  }

  const updated = await prisma.ordemServico.update({
    where: { id: params.id },
    data,
    include,
  });

  notifyClienteStatusChange("os_concluida", { cliente: os.cliente, os: updated });

  return NextResponse.json(updated);
}
