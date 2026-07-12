import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const [clientes, ordens] = await Promise.all([
    prisma.cliente.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.ordemServico.findMany({
      where: { deletedAt: { not: null } },
      include: { cliente: { select: { id: true, name: true } } },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ clientes, ordens });
}
