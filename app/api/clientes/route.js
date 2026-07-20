import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const clientes = await prisma.cliente.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(clientes);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem cadastrar clientes" }, { status: 403 });
  }

  const body = await req.json();
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  const documento = (body.documento || "").trim();
  const cep = (body.cep || "").trim();
  const logradouro = (body.logradouro || "").trim();
  const numero = (body.numero || "").trim();
  const complemento = (body.complemento || "").trim();
  const bairro = (body.bairro || "").trim();
  const cidade = (body.cidade || "").trim();
  const uf = (body.uf || "").trim();
  const observacoes = (body.observacoes || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const cliente = await prisma.cliente.create({
    data: {
      name,
      phone,
      email: email || null,
      documento: documento || null,
      dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
      cep: cep || null,
      logradouro: logradouro || null,
      numero: numero || null,
      complemento: complemento || null,
      bairro: bairro || null,
      cidade: cidade || null,
      uf: uf || null,
      observacoes: observacoes || null,
    },
  });

  await registrarAuditoria({
    session,
    action: "create",
    entity: "Cliente",
    entityId: cliente.id,
    description: `${session.user.name} cadastrou o cliente ${cliente.name}`,
  });

  return NextResponse.json(cliente, { status: 201 });
}
