import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const parceiro = await prisma.parceiro.findUnique({
    where: { id: params.id },
    include: {
      ordens: {
        include: { cliente: true, technician: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!parceiro) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  return NextResponse.json(parceiro);
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json();
  const data = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.phone === "string") data.phone = body.phone.trim() || null;
  if (typeof body.email === "string") data.email = body.email.trim() || null;
  if (typeof body.documento === "string") data.documento = body.documento.trim() || null;
  if (typeof body.observacoes === "string") data.observacoes = body.observacoes.trim() || null;

  if (data.name === "") {
    return NextResponse.json({ error: "Nome não pode ficar em branco" }, { status: 400 });
  }

  const parceiro = await prisma.parceiro.update({ where: { id: params.id }, data });
  return NextResponse.json(parceiro);
}

// Exclusão do parceiro — só admin. Bloqueada se existirem OS vinculadas
// (mesma proteção usada em app/api/clientes/[id]/route.js).
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem excluir parceiros" }, { status: 403 });
  }

  const parceiro = await prisma.parceiro.findUnique({
    where: { id: params.id },
    include: { _count: { select: { ordens: true } } },
  });
  if (!parceiro) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }
  if (parceiro._count.ordens > 0) {
    return NextResponse.json(
      {
        error: `Não é possível excluir: existem ${parceiro._count.ordens} ordem(ns) de serviço vinculada(s) a este parceiro. Exclua-as primeiro.`,
      },
      { status: 409 }
    );
  }

  await prisma.parceiro.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
