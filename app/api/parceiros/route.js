import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const parceiros = await prisma.parceiro.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(parceiros);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem cadastrar parceiros" }, { status: 403 });
  }

  const body = await req.json();
  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nome do parceiro é obrigatório" }, { status: 400 });
  }

  const parceiro = await prisma.parceiro.create({
    data: {
      name,
      phone: (body.phone || "").trim() || null,
      email: (body.email || "").trim() || null,
      documento: (body.documento || "").trim() || null,
      observacoes: (body.observacoes || "").trim() || null,
    },
  });

  await registrarAuditoria({
    session,
    action: "create",
    entity: "Parceiro",
    entityId: parceiro.id,
    description: `${session.user.name} cadastrou o parceiro ${parceiro.name}`,
  });

  return NextResponse.json(parceiro, { status: 201 });
}
