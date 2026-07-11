import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const despesa = await prisma.despesa.findUnique({ where: { id: params.id } });
  if (!despesa) {
    return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
  }

  await prisma.despesa.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
