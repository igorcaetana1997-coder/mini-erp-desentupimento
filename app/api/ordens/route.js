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

const VALID_PARCERIA_TIPOS = ["repassado", "recebido"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const where = session.user.role === "admin" ? {} : { technicianId: session.user.id };

  const ordens = await prisma.ordemServico.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ordens);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem abrir ordens de serviço" }, { status: 403 });
  }

  const body = await req.json();
  const {
    clienteId,
    serviceType,
    technicianId,
    value,
    scheduledAt,
    urgent,
    paymentMethod,
    dueDate,
    parceiroId,
    parceriaTipo,
    parceriaPercentual,
  } = body;

  if (!clienteId || !serviceType) {
    return NextResponse.json({ error: "Cliente e tipo de serviço são obrigatórios" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  if (technicianId) {
    const tecnico = await prisma.user.findUnique({ where: { id: technicianId } });
    if (!tecnico || tecnico.role !== "tecnico") {
      return NextResponse.json({ error: "Técnico inválido" }, { status: 400 });
    }
  }

  const VALID_PAYMENT_METHODS = ["dinheiro", "pix", "cartao", "boleto"];
  if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: "Forma de pagamento inválida" }, { status: 400 });
  }

  if (parceiroId) {
    const parceiro = await prisma.parceiro.findUnique({ where: { id: parceiroId } });
    if (!parceiro) {
      return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
    }
    if (!VALID_PARCERIA_TIPOS.includes(parceriaTipo)) {
      return NextResponse.json({ error: "Tipo de parceria inválido" }, { status: 400 });
    }
    const percentual = Number(parceriaPercentual);
    if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
      return NextResponse.json({ error: "Percentual da comissão deve ser um número entre 0 e 100" }, { status: 400 });
    }
  }

  const os = await prisma.ordemServico.create({
    data: {
      clienteId,
      serviceType,
      technicianId: technicianId || null,
      value: value !== undefined && value !== "" ? Number(value) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      urgent: !!urgent,
      status: "aberta",
      paymentMethod: paymentMethod || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      parceiroId: parceiroId || null,
      parceriaTipo: parceiroId ? parceriaTipo : null,
      parceriaPercentual: parceiroId ? Number(parceriaPercentual) : null,
    },
    include,
  });

  return NextResponse.json(os, { status: 201 });
}
