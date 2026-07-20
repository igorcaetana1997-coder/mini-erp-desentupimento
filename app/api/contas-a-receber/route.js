import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGestor } from "@/lib/permissions";
import { getStatusPagamento } from "@/lib/paymentStatus";

// Derivado de OrdemServico — não é uma tabela própria. Lista as OS com
// value definido e pagamento ainda não concluído, ordenadas por vencimento.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isGestor(session.user.role)) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const ordens = await prisma.ordemServico.findMany({
    where: { value: { not: null }, deletedAt: null },
    include: { cliente: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });

  const pendentes = ordens
    .map((os) => ({ ...os, ...getStatusPagamento(os) }))
    .filter((os) => os.status === "pendente" || os.status === "parcial");

  return NextResponse.json(pendentes);
}
