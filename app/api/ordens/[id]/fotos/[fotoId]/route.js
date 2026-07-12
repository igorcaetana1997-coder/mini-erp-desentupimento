import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAccess(session, osId) {
  const os = await prisma.ordemServico.findUnique({ where: { id: osId } });
  if (!os) return { os: null };
  const isAdmin = session.user.role === "admin";
  const isOwner = os.technicianId === session.user.id;
  return { os, allowed: isAdmin || isOwner };
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { os, allowed } = await checkAccess(session, params.id);
  if (!os) return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Sem acesso a esta OS" }, { status: 403 });

  const foto = await prisma.fotoServico.findUnique({ where: { id: params.fotoId } });
  if (!foto || foto.ordemServicoId !== params.id) {
    return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
  }

  await prisma.fotoServico.delete({ where: { id: params.fotoId } });

  return NextResponse.json({ ok: true });
}
