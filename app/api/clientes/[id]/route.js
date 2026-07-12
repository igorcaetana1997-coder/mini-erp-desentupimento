import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      ordens: {
        include: { technician: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(cliente);
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json();
  const data = {};
  if (body.restaurar === true) {
    data.deletedAt = null;
  }
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.phone === "string") data.phone = body.phone.trim();
  if (typeof body.email === "string") data.email = body.email.trim() || null;
  if (typeof body.documento === "string") data.documento = body.documento.trim() || null;
  if (body.dataNascimento !== undefined) {
    data.dataNascimento = body.dataNascimento ? new Date(body.dataNascimento) : null;
  }
  if (typeof body.cep === "string") data.cep = body.cep.trim() || null;
  if (typeof body.logradouro === "string") data.logradouro = body.logradouro.trim() || null;
  if (typeof body.numero === "string") data.numero = body.numero.trim() || null;
  if (typeof body.complemento === "string") data.complemento = body.complemento.trim() || null;
  if (typeof body.bairro === "string") data.bairro = body.bairro.trim() || null;
  if (typeof body.cidade === "string") data.cidade = body.cidade.trim() || null;
  if (typeof body.uf === "string") data.uf = body.uf.trim() || null;
  if (typeof body.observacoes === "string") data.observacoes = body.observacoes.trim() || null;

  if (data.name === "") {
    return NextResponse.json({ error: "Nome não pode ficar em branco" }, { status: 400 });
  }

  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(cliente);
}

// Exclusão do cliente — só admin. Primeira chamada move pra lixeira (soft
// delete); segunda chamada (a partir da tela de Lixeira, com o registro já
// deletedAt preenchido) apaga de vez. Bloqueada se existirem OS ativas
// (não deletadas) vinculadas, para não perder histórico de serviço sem querer.
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem excluir clientes" }, { status: 403 });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: { _count: { select: { ordens: { where: { deletedAt: null } } } } },
  });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  if (cliente._count.ordens > 0) {
    return NextResponse.json(
      {
        error: `Não é possível excluir: existem ${cliente._count.ordens} ordem(ns) de serviço vinculada(s) a este cliente. Exclua-as primeiro.`,
      },
      { status: 409 }
    );
  }

  if (!cliente.deletedAt) {
    await prisma.cliente.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true, lixeira: true });
  }

  await prisma.cliente.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
