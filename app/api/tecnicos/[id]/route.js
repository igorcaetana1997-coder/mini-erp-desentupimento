import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Exclusão de técnico — só admin. As OS já atribuídas a ele ficam sem
// técnico designado (FK technicianId é ON DELETE SET NULL), não são apagadas.
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem excluir técnicos" }, { status: 403 });
  }

  const tecnico = await prisma.user.findUnique({ where: { id: params.id } });
  if (!tecnico || tecnico.role !== "tecnico") {
    return NextResponse.json({ error: "Técnico não encontrado" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
